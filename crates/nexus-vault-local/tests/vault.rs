//! Propiedades de seguridad del almacén local (ver docs/17 y docs/07).

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use nexus_vault_local::{CompartmentKind, DevFileKeyStore, Error, Vault};

/// Directorio temporal propio que se borra al terminar.
struct TempDir(PathBuf);
impl TempDir {
    fn new(tag: &str) -> Self {
        static N: AtomicU64 = AtomicU64::new(0);
        let p = std::env::temp_dir().join(format!(
            "nexus-vault-{tag}-{}-{}",
            std::process::id(),
            N.fetch_add(1, Ordering::Relaxed)
        ));
        let _ = fs::remove_dir_all(&p);
        TempDir(p)
    }
    fn path(&self) -> &Path {
        &self.0
    }
}
impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

/// Almacén con reloj controlado.
fn vault(dir: &TempDir) -> (Vault<DevFileKeyStore>, Arc<AtomicU64>) {
    let keys = DevFileKeyStore::new(dir.path().join("keys")).unwrap();
    let mut v = Vault::create(dir.path().join("vault"), keys, "laura.m").unwrap();
    let clock = Arc::new(AtomicU64::new(1_000));
    let c = clock.clone();
    v.set_clock(move || c.load(Ordering::Relaxed));
    (v, clock)
}

fn all_bytes(dir: &Path) -> Vec<u8> {
    let mut out = Vec::new();
    for e in fs::read_dir(dir).unwrap() {
        let p = e.unwrap().path();
        if p.is_dir() {
            out.extend(all_bytes(&p));
        } else {
            out.extend(fs::read(p).unwrap());
        }
    }
    out
}

fn contains(hay: &[u8], needle: &[u8]) -> bool {
    hay.windows(needle.len()).any(|w| w == needle)
}

#[test]
fn guardar_leer_y_versiones() {
    let d = TempDir::new("rw");
    let (v, clock) = vault(&d);
    let c = v
        .create_compartment("Caso 2026-114 · Arrendamiento", CompartmentKind::Caso)
        .unwrap();
    assert_eq!(v.put(&c, "contrato.docx", b"version uno").unwrap(), 1);
    clock.store(2_000, Ordering::Relaxed);
    assert_eq!(v.put(&c, "contrato.docx", b"version dos").unwrap(), 2);
    assert_eq!(
        v.read(&c, "contrato.docx", None).unwrap().as_slice(),
        b"version dos"
    );
    assert_eq!(
        v.read(&c, "contrato.docx", Some(1)).unwrap().as_slice(),
        b"version uno"
    );
    let files = v.files(&c).unwrap();
    assert_eq!(files.len(), 1);
    assert_eq!(files[0].versions.len(), 2);
    assert!(matches!(
        v.read(&c, "contrato.docx", Some(9)),
        Err(Error::UnknownFile)
    ));
}

/// Ni el contenido ni los nombres de archivo ni el nombre de la carpeta aparecen en disco.
#[test]
fn nada_en_claro_en_disco() {
    let d = TempDir::new("plain");
    let (v, _) = vault(&d);
    let c = v
        .create_compartment("Constructora Andina", CompartmentKind::Cliente)
        .unwrap();
    v.put(&c, "Demanda_Rodriguez.pdf", b"CONTENIDO-CONFIDENCIAL-12345")
        .unwrap();
    let disk = all_bytes(&d.path().join("vault"));
    for needle in [
        &b"CONTENIDO-CONFIDENCIAL-12345"[..],
        b"Demanda_Rodriguez",
        b"Constructora Andina",
    ] {
        assert!(
            !contains(&disk, needle),
            "aparece en claro: {}",
            String::from_utf8_lossy(needle)
        );
    }
}

/// Guardar una versión nueva no modifica ningún archivo existente.
#[test]
fn las_versiones_son_inmutables() {
    let d = TempDir::new("immut");
    let (v, _) = vault(&d);
    let c = v.create_compartment("Caso", CompartmentKind::Caso).unwrap();
    v.put(&c, "a.txt", b"uno").unwrap();
    let before = snapshot(&d.path().join("vault/compartments"));
    v.put(&c, "a.txt", b"dos").unwrap();
    let after = snapshot(&d.path().join("vault/compartments"));
    for (path, bytes) in &before {
        assert_eq!(after.get(path), Some(bytes), "cambió {path:?}");
    }
    assert!(after.len() > before.len());
}

fn snapshot(dir: &Path) -> std::collections::BTreeMap<PathBuf, Vec<u8>> {
    let mut m = std::collections::BTreeMap::new();
    for e in fs::read_dir(dir).unwrap() {
        let p = e.unwrap().path();
        if p.is_dir() {
            m.extend(snapshot(&p));
        } else {
            m.insert(p.clone(), fs::read(&p).unwrap());
        }
    }
    m
}

#[test]
fn restaurar_a_un_instante_en_carpeta_nueva() {
    let d = TempDir::new("restore");
    let (v, clock) = vault(&d);
    let c = v.create_compartment("Caso", CompartmentKind::Caso).unwrap();
    clock.store(100, Ordering::Relaxed);
    v.put(&c, "contrato.docx", b"v1").unwrap();
    clock.store(200, Ordering::Relaxed);
    v.put(&c, "contrato.docx", b"v2").unwrap();
    v.put(&c, "anexo.xlsx", b"anexo").unwrap();
    clock.store(300, Ordering::Relaxed);
    v.put(&c, "contrato.docx", b"v3-cifrado-por-ransomware")
        .unwrap();

    let dest = d.path().join("Restaurado");
    let r = v.restore(&c, 250, &dest).unwrap();
    assert_eq!(fs::read(dest.join("contrato.docx")).unwrap(), b"v2");
    assert_eq!(fs::read(dest.join("anexo.xlsx")).unwrap(), b"anexo");
    assert_eq!(r.restored.len(), 2);

    let dest2 = d.path().join("Restaurado-antes");
    let r2 = v.restore(&c, 150, &dest2).unwrap();
    assert_eq!(fs::read(dest2.join("contrato.docx")).unwrap(), b"v1");
    assert_eq!(r2.not_present, vec!["anexo.xlsx".to_string()]);

    // Lo actual sigue intacto.
    assert_eq!(
        v.read(&c, "contrato.docx", None).unwrap().as_slice(),
        b"v3-cifrado-por-ransomware"
    );
    // No se restaura sobre una carpeta con contenido.
    assert!(matches!(
        v.restore(&c, 250, &dest),
        Err(Error::DestinationNotEmpty)
    ));
}

/// Un nombre de archivo malicioso no puede escribir fuera de la carpeta de recuperación.
#[test]
fn nombres_con_rutas_se_rechazan() {
    let d = TempDir::new("names");
    let (v, _) = vault(&d);
    let c = v.create_compartment("Caso", CompartmentKind::Caso).unwrap();
    for bad in [
        "../evil.txt",
        "..\\evil.txt",
        "a/b.txt",
        "C:evil",
        "",
        ".",
        "..",
        "nul\u{0}.txt",
        "fin.",
        "fin ",
    ] {
        assert!(
            matches!(v.put(&c, bad, b"x"), Err(Error::InvalidName)),
            "aceptó {bad:?}"
        );
    }
    assert!(v.put(&c, "Informe final (v2).pdf", b"x").is_ok());
}

#[test]
fn contenido_manipulado_se_detecta() {
    let d = TempDir::new("tamper");
    let (v, _) = vault(&d);
    let c = v.create_compartment("Caso", CompartmentKind::Caso).unwrap();
    v.put(&c, "a.txt", b"contenido original").unwrap();
    let obj_dir = fs::read_dir(
        d.path()
            .join("vault/compartments")
            .join(c.hex())
            .join("objects"),
    )
    .unwrap()
    .next()
    .unwrap()
    .unwrap()
    .path();
    let f = obj_dir.join("v1.ncobj");
    let mut bytes = fs::read(&f).unwrap();
    let last = bytes.len() - 1;
    bytes[last] ^= 1;
    fs::write(&f, bytes).unwrap();
    assert!(matches!(v.read(&c, "a.txt", None), Err(Error::Crypto(_))));
}

/// Copiar un objeto cifrado de una carpeta a otra (o sustituir una versión) no funciona.
#[test]
fn mover_objetos_entre_carpetas_falla() {
    let d = TempDir::new("swap");
    let (v, _) = vault(&d);
    let a = v
        .create_compartment("Cliente A", CompartmentKind::Cliente)
        .unwrap();
    let b = v
        .create_compartment("Cliente B", CompartmentKind::Cliente)
        .unwrap();
    v.put(&a, "secreto.txt", b"datos de A").unwrap();
    v.put(&b, "secreto.txt", b"datos de B").unwrap();
    let obj = |c: &nexus_vault_local::Id| {
        fs::read_dir(
            d.path()
                .join("vault/compartments")
                .join(c.hex())
                .join("objects"),
        )
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path()
        .join("v1.ncobj")
    };
    fs::copy(obj(&a), obj(&b)).unwrap();
    assert!(matches!(
        v.read(&b, "secreto.txt", None),
        Err(Error::Crypto(_))
    ));
}

/// Borrar la versión más reciente del índice para "volver atrás" se detecta.
#[test]
fn rollback_del_indice_se_detecta() {
    let d = TempDir::new("rollback");
    let (v, _) = vault(&d);
    let c = v.create_compartment("Caso", CompartmentKind::Caso).unwrap();
    v.put(&c, "a.txt", b"uno").unwrap();
    v.put(&c, "b.txt", b"dos").unwrap(); // índice v3
    fs::remove_file(
        d.path()
            .join("vault/compartments")
            .join(c.hex())
            .join("manifest/v3.ncobj"),
    )
    .unwrap();
    assert!(matches!(
        v.files(&c),
        Err(Error::RollbackDetected {
            esperado: 3,
            encontrado: 2
        })
    ));
}

#[test]
fn el_registro_detecta_ediciones_y_borrados() {
    let d = TempDir::new("audit");
    let (v, _) = vault(&d);
    let c = v.create_compartment("Caso", CompartmentKind::Caso).unwrap();
    v.put(&c, "a.txt", b"x").unwrap();
    v.read(&c, "a.txt", None).unwrap();
    let entries = v.audit().unwrap();
    assert_eq!(entries.len(), 4);

    let log = d.path().join("vault/audit.log");
    let original = fs::read_to_string(&log).unwrap();

    // Editar una entrada intermedia (cambiar el actor).
    fs::write(&log, original.replacen("laura.m", "intruso", 2)).unwrap();
    assert!(matches!(v.audit(), Err(Error::AuditTampered { .. })));

    // Borrar una entrada intermedia.
    let lines: Vec<&str> = original.lines().collect();
    let without: String = lines
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != 1)
        .map(|(_, l)| format!("{l}\n"))
        .collect();
    fs::write(&log, without).unwrap();
    assert!(matches!(v.audit(), Err(Error::AuditTampered { linea: 2 })));

    // Con el registro alterado, el almacén se niega a abrirse.
    let keys = DevFileKeyStore::new(d.path().join("keys")).unwrap();
    assert!(Vault::open(d.path().join("vault"), keys, "laura.m").is_err());
}

/// El registro sólo contiene identificadores, nunca nombres (regla 10: nada sensible en logs).
#[test]
fn el_registro_no_contiene_nombres() {
    let d = TempDir::new("auditnames");
    let (v, _) = vault(&d);
    let c = v
        .create_compartment("Clínica Salud Norte", CompartmentKind::Cliente)
        .unwrap();
    v.put(&c, "Historia_clinica_paciente_77.pdf", b"x").unwrap();
    let log = fs::read_to_string(d.path().join("vault/audit.log")).unwrap();
    assert!(!log.contains("Clínica") && !log.contains("Historia_clinica"));
}

#[test]
fn reabrir_el_almacen_conserva_todo() {
    let d = TempDir::new("reopen");
    let c = {
        let (v, _) = vault(&d);
        let c = v
            .create_compartment("Caso 2026-131", CompartmentKind::Caso)
            .unwrap();
        v.put(&c, "a.txt", b"persistente").unwrap();
        c
    };
    let keys = DevFileKeyStore::new(d.path().join("keys")).unwrap();
    let v = Vault::open(d.path().join("vault"), keys, "andres.r").unwrap();
    let list = v.compartments().unwrap();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].name, "Caso 2026-131");
    assert_eq!(
        v.read(&c, "a.txt", None).unwrap().as_slice(),
        b"persistente"
    );
}

/// Sin la clave correcta de la carpeta, nada se descifra.
#[test]
fn sin_la_clave_correcta_no_se_descifra() {
    let d = TempDir::new("wrongkey");
    let (v, _) = vault(&d);
    let c = v.create_compartment("Caso", CompartmentKind::Caso).unwrap();
    v.put(&c, "a.txt", b"x").unwrap();
    let key_file = d.path().join("keys").join(format!("{}.dev-kek", c.hex()));
    fs::write(&key_file, [7u8; 32]).unwrap();
    assert!(matches!(v.files(&c), Err(Error::Crypto(_))));
}
