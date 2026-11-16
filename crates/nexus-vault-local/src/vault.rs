//! Almacén local cifrado.
//!
//! ```text
//! <raíz>/vault.json                                   organización (sin secretos)
//! <raíz>/audit.log                                    registro encadenado (sólo identificadores)
//! <raíz>/compartments/<carpeta>/manifest/v<N>.ncobj   índice cifrado: nombres, versiones (inmutable)
//! <raíz>/compartments/<carpeta>/objects/<obj>/v<N>.ncobj  contenido cifrado de cada versión (inmutable)
//! ```
//!
//! - Nada se sobrescribe: cada versión y cada índice se crean con `create_new`.
//! - Los nombres de archivo y de carpeta sólo existen dentro del índice cifrado.
//! - Cada objeto está vinculado a (organización, carpeta, objeto, versión): no se puede mover ni
//!   sustituir por otro sin que falle el descifrado.

use std::collections::BTreeMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use nexus_envelope::{ObjectContext, open, seal};
use serde::{Deserialize, Serialize};
use zeroize::Zeroizing;

use crate::audit::{AuditLog, Entry, Kind as EventKind, NewEvent};
use crate::error::Error;
use crate::ids::{Id, MANIFEST_OBJECT};
use crate::keystore::KeyStore;

const FORMAT: u32 = 1;

/// Tipo de carpeta protegida (ADR-0011).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CompartmentKind {
    /// Una carpeta por cliente.
    Cliente,
    /// Una carpeta por caso.
    Caso,
}

/// Información de una versión.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VersionInfo {
    pub n: u64,
    pub created_at: u64,
    pub size: u64,
    pub author: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct FileEntry {
    object: Id,
    versions: Vec<VersionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Manifest {
    version: u64,
    name: String,
    kind: CompartmentKind,
    created_at: u64,
    files: BTreeMap<String, FileEntry>,
}

/// Resumen de una carpeta protegida (descifrado en memoria).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompartmentSummary {
    pub id: Id,
    pub name: String,
    pub kind: CompartmentKind,
    pub files: usize,
    pub manifest_version: u64,
}

/// Archivo de una carpeta con su historial de versiones.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileSummary {
    pub name: String,
    /// Identificador del objeto (el que aparece en el registro de actividad).
    pub object: Id,
    pub versions: Vec<VersionInfo>,
}

/// Resultado de una recuperación.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RestoreReport {
    /// (nombre, versión restaurada)
    pub restored: Vec<(String, u64)>,
    /// Archivos que aún no existían en ese instante.
    pub not_present: Vec<String>,
    pub destination: PathBuf,
}

#[derive(Serialize, Deserialize)]
struct VaultFile {
    format: u32,
    tenant: Id,
}

type Clock = Box<dyn Fn() -> u64 + Send + Sync>;

/// Almacén local cifrado de un usuario en un equipo.
pub struct Vault<K: KeyStore> {
    root: PathBuf,
    tenant: Id,
    keys: K,
    audit: AuditLog,
    actor: String,
    clock: Clock,
}

fn system_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_secs())
}

/// Escribe un archivo nuevo; falla si ya existe (inmutabilidad).
fn write_new(path: &Path, bytes: &[u8]) -> Result<(), Error> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir)?;
    }
    let mut f = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    f.write_all(bytes)?;
    f.sync_all()?;
    Ok(())
}

/// Un nombre de archivo válido no puede salir de su carpeta al restaurarse.
fn validate_name(name: &str) -> Result<(), Error> {
    let bad = name.is_empty()
        || name.len() > 255
        || name == "."
        || name == ".."
        || name.contains(['/', '\\', ':'])
        || name.chars().any(char::is_control)
        || name.ends_with(['.', ' ']);
    if bad { Err(Error::InvalidName) } else { Ok(()) }
}

impl<K: KeyStore> Vault<K> {
    /// Crea un almacén nuevo en `root` (debe no existir o estar vacío).
    ///
    /// # Errors
    /// Si ya existe un almacén en `root` o falla la escritura.
    pub fn create(root: impl AsRef<Path>, keys: K, actor: &str) -> Result<Self, Error> {
        let root = root.as_ref().to_path_buf();
        fs::create_dir_all(&root)?;
        let tenant = Id::random()?;
        let vf = serde_json::to_vec_pretty(&VaultFile {
            format: FORMAT,
            tenant,
        })
        .map_err(|_| Error::Corrupt("vault.json"))?;
        write_new(&root.join("vault.json"), &vf)?;
        let v = Vault {
            audit: AuditLog::new(root.join("audit.log")),
            root,
            tenant,
            keys,
            actor: actor.to_owned(),
            clock: Box::new(system_now),
        };
        v.log(EventKind::VaultCreated, None, None, None, None)?;
        Ok(v)
    }

    /// Abre un almacén existente y verifica su registro de actividad.
    ///
    /// # Errors
    /// Si no existe, está dañado o el registro fue alterado.
    pub fn open(root: impl AsRef<Path>, keys: K, actor: &str) -> Result<Self, Error> {
        let root = root.as_ref().to_path_buf();
        let vf: VaultFile = serde_json::from_slice(&fs::read(root.join("vault.json"))?)
            .map_err(|_| Error::Corrupt("vault.json"))?;
        if vf.format != FORMAT {
            return Err(Error::Corrupt("versión de formato"));
        }
        let v = Vault {
            audit: AuditLog::new(root.join("audit.log")),
            root,
            tenant: vf.tenant,
            keys,
            actor: actor.to_owned(),
            clock: Box::new(system_now),
        };
        v.audit.verify()?;
        Ok(v)
    }

    /// Sustituye el reloj (pruebas).
    pub fn set_clock(&mut self, clock: impl Fn() -> u64 + Send + Sync + 'static) {
        self.clock = Box::new(clock);
    }

    fn now(&self) -> u64 {
        (self.clock)()
    }

    fn log(
        &self,
        kind: EventKind,
        c: Option<&Id>,
        o: Option<&Id>,
        version: Option<u64>,
        mv: Option<u64>,
    ) -> Result<Entry, Error> {
        self.audit.append(NewEvent {
            ts: self.now(),
            actor: &self.actor,
            kind,
            compartment: c.map(Id::hex),
            object: o.map(Id::hex),
            version,
            manifest_version: mv,
        })
    }

    fn cdir(&self, c: &Id) -> PathBuf {
        self.root.join("compartments").join(c.hex())
    }

    fn ctx(&self, c: &Id, o: &Id, version: u64) -> ObjectContext {
        ObjectContext {
            tenant_id: self.tenant.0,
            compartment_id: c.0,
            object_id: o.0,
            object_version: version,
        }
    }

    /// Versiones `v<N>.ncobj` presentes en un directorio.
    fn versions_in(dir: &Path) -> Result<Vec<u64>, Error> {
        let mut out = Vec::new();
        for e in fs::read_dir(dir)? {
            let name = e?.file_name();
            let name = name.to_string_lossy();
            if let Some(n) = name
                .strip_prefix('v')
                .and_then(|s| s.strip_suffix(".ncobj"))
                .and_then(|s| s.parse().ok())
            {
                out.push(n);
            }
        }
        out.sort_unstable();
        Ok(out)
    }

    /// Última versión del índice anotada en el registro para esta carpeta.
    fn expected_manifest_version(&self, c: &Id) -> Result<u64, Error> {
        let hex = c.hex();
        Ok(self
            .audit
            .verify()?
            .iter()
            .filter(|e| e.compartment.as_deref() == Some(hex.as_str()))
            .filter_map(|e| e.manifest_version)
            .max()
            .unwrap_or(0))
    }

    fn load_manifest(&self, c: &Id) -> Result<Manifest, Error> {
        let dir = self.cdir(c).join("manifest");
        if !dir.exists() {
            return Err(Error::UnknownCompartment);
        }
        let latest = *Self::versions_in(&dir)?
            .last()
            .ok_or(Error::Corrupt("índice vacío"))?;
        let expected = self.expected_manifest_version(c)?;
        if latest < expected {
            return Err(Error::RollbackDetected {
                esperado: expected,
                encontrado: latest,
            });
        }
        let kek = self.keys.get(c)?;
        let sealed = fs::read(dir.join(format!("v{latest}.ncobj")))?;
        let plain = open(
            kek.as_ref(),
            &self.ctx(c, &MANIFEST_OBJECT, latest),
            &sealed,
        )?;
        let m: Manifest = serde_json::from_slice(&plain).map_err(|_| Error::Corrupt("índice"))?;
        if m.version != latest {
            return Err(Error::Corrupt("versión del índice"));
        }
        Ok(m)
    }

    fn store_manifest(&self, c: &Id, m: &Manifest) -> Result<(), Error> {
        let kek = self.keys.get(c)?;
        let plain = Zeroizing::new(serde_json::to_vec(m).map_err(|_| Error::Corrupt("índice"))?);
        let sealed = seal(
            kek.as_ref(),
            &self.ctx(c, &MANIFEST_OBJECT, m.version),
            &plain,
        )?;
        write_new(
            &self
                .cdir(c)
                .join("manifest")
                .join(format!("v{}.ncobj", m.version)),
            &sealed,
        )
    }

    /// Crea una carpeta protegida con su propia clave.
    ///
    /// # Errors
    /// Si falla la creación de la clave o la escritura.
    pub fn create_compartment(&self, name: &str, kind: CompartmentKind) -> Result<Id, Error> {
        if name.trim().is_empty() || name.len() > 200 {
            return Err(Error::InvalidName);
        }
        let id = Id::random()?;
        self.keys.create(&id)?;
        let m = Manifest {
            version: 1,
            name: name.to_owned(),
            kind,
            created_at: self.now(),
            files: BTreeMap::new(),
        };
        self.store_manifest(&id, &m)?;
        self.log(
            EventKind::CompartmentCreated,
            Some(&id),
            None,
            None,
            Some(1),
        )?;
        Ok(id)
    }

    /// Lista las carpetas protegidas (descifra sus índices).
    ///
    /// # Errors
    /// Si algún índice está dañado, manipulado o fue revertido.
    pub fn compartments(&self) -> Result<Vec<CompartmentSummary>, Error> {
        let base = self.root.join("compartments");
        if !base.exists() {
            return Ok(Vec::new());
        }
        let mut out = Vec::new();
        for e in fs::read_dir(base)? {
            let name = e?.file_name().to_string_lossy().into_owned();
            let id = Id::try_from(name).map_err(|_| Error::Corrupt("carpeta"))?;
            let m = self.load_manifest(&id)?;
            out.push(CompartmentSummary {
                id,
                name: m.name,
                kind: m.kind,
                files: m.files.len(),
                manifest_version: m.version,
            });
        }
        out.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(out)
    }

    /// Guarda una versión nueva de un archivo. Las versiones anteriores no se tocan.
    ///
    /// # Errors
    /// Nombre inválido, carpeta inexistente o fallo de escritura.
    pub fn put(&self, c: &Id, name: &str, content: &[u8]) -> Result<u64, Error> {
        validate_name(name)?;
        let mut m = self.load_manifest(c)?;
        let kek = self.keys.get(c)?;
        let entry = match m.files.get(name) {
            Some(e) => e.clone(),
            None => FileEntry {
                object: Id::random()?,
                versions: Vec::new(),
            },
        };
        let n = entry.versions.last().map_or(1, |v| v.n + 1);
        let sealed = seal(kek.as_ref(), &self.ctx(c, &entry.object, n), content)?;
        write_new(
            &self
                .cdir(c)
                .join("objects")
                .join(entry.object.hex())
                .join(format!("v{n}.ncobj")),
            &sealed,
        )?;

        let mut entry = entry;
        entry.versions.push(VersionInfo {
            n,
            created_at: self.now(),
            size: content.len() as u64,
            author: self.actor.clone(),
        });
        let object = entry.object;
        m.files.insert(name.to_owned(), entry);
        m.version += 1;
        self.store_manifest(c, &m)?;
        self.log(
            EventKind::VersionWritten,
            Some(c),
            Some(&object),
            Some(n),
            Some(m.version),
        )?;
        Ok(n)
    }

    /// Archivos de una carpeta con su historial.
    ///
    /// # Errors
    /// Si el índice no se puede descifrar o fue revertido.
    pub fn files(&self, c: &Id) -> Result<Vec<FileSummary>, Error> {
        let m = self.load_manifest(c)?;
        Ok(m.files
            .into_iter()
            .map(|(name, e)| FileSummary {
                name,
                object: e.object,
                versions: e.versions,
            })
            .collect())
    }

    /// Descifra una versión (la última si `version` es `None`). Se borra de memoria al liberarse.
    ///
    /// # Errors
    /// Archivo o versión inexistente, o contenido manipulado.
    pub fn read(
        &self,
        c: &Id,
        name: &str,
        version: Option<u64>,
    ) -> Result<Zeroizing<Vec<u8>>, Error> {
        let m = self.load_manifest(c)?;
        let e = m.files.get(name).ok_or(Error::UnknownFile)?;
        let n = match version {
            Some(n) if e.versions.iter().any(|v| v.n == n) => n,
            Some(_) => return Err(Error::UnknownFile),
            None => e.versions.last().ok_or(Error::UnknownFile)?.n,
        };
        let kek = self.keys.get(c)?;
        let sealed = fs::read(
            self.cdir(c)
                .join("objects")
                .join(e.object.hex())
                .join(format!("v{n}.ncobj")),
        )?;
        let plain = open(kek.as_ref(), &self.ctx(c, &e.object, n), &sealed)?;
        self.log(
            EventKind::VersionRead,
            Some(c),
            Some(&e.object),
            Some(n),
            None,
        )?;
        Ok(plain)
    }

    /// Restaura la carpeta tal como estaba en el instante `at` (segundos UNIX) en `destination`,
    /// que debe no existir o estar vacía. No modifica ninguna versión guardada.
    ///
    /// # Errors
    /// Destino no vacío, carpeta inexistente o contenido manipulado.
    pub fn restore(
        &self,
        c: &Id,
        at: u64,
        destination: impl AsRef<Path>,
    ) -> Result<RestoreReport, Error> {
        let dest = destination.as_ref().to_path_buf();
        if dest.exists() && fs::read_dir(&dest)?.next().is_some() {
            return Err(Error::DestinationNotEmpty);
        }
        let m = self.load_manifest(c)?;
        let kek = self.keys.get(c)?;
        fs::create_dir_all(&dest)?;
        let mut restored = Vec::new();
        let mut not_present = Vec::new();
        for (name, e) in &m.files {
            validate_name(name)?; // defensa en profundidad: el índice viene de disco
            let Some(v) = e.versions.iter().rev().find(|v| v.created_at <= at) else {
                not_present.push(name.clone());
                continue;
            };
            let sealed = fs::read(
                self.cdir(c)
                    .join("objects")
                    .join(e.object.hex())
                    .join(format!("v{}.ncobj", v.n)),
            )?;
            let plain = open(kek.as_ref(), &self.ctx(c, &e.object, v.n), &sealed)?;
            write_new(&dest.join(name), &plain)?;
            restored.push((name.clone(), v.n));
        }
        self.log(EventKind::Restored, Some(c), None, None, None)?;
        Ok(RestoreReport {
            restored,
            not_present,
            destination: dest,
        })
    }

    /// Verifica y devuelve el registro de actividad.
    ///
    /// # Errors
    /// [`Error::AuditTampered`] si fue alterado.
    pub fn audit(&self) -> Result<Vec<Entry>, Error> {
        self.audit.verify()
    }
}
