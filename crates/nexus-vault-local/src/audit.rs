//! Registro de actividad local encadenado con SHA-256 (precursor de NEXUS TRUST).
//!
//! Cada entrada incluye el hash de la anterior: editar o borrar una entrada intermedia rompe la
//! cadena. Truncar el final sólo se detecta con testigos externos (NEXUS TRUST, ADR-0006).
//! **Nunca** contiene nombres de archivo ni contenido: sólo identificadores (regla 10).

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::error::Error;

/// Tipo de evento registrado.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    /// Se creó el almacén.
    VaultCreated,
    /// Se creó una carpeta protegida.
    CompartmentCreated,
    /// Se guardó una versión nueva de un archivo.
    VersionWritten,
    /// Se leyó (descifró) una versión.
    VersionRead,
    /// Se restauró una carpeta a un instante dado.
    Restored,
}

/// Entrada del registro.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Entry {
    pub seq: u64,
    pub ts: u64,
    pub actor: String,
    pub kind: Kind,
    /// Carpeta afectada (identificador, nunca el nombre).
    pub compartment: Option<String>,
    /// Objeto afectado (identificador, nunca el nombre).
    pub object: Option<String>,
    pub version: Option<u64>,
    /// Versión del índice cifrado de la carpeta tras el evento (detección de rollback).
    pub manifest_version: Option<u64>,
    pub prev: String,
    pub hash: String,
}

const GENESIS: &str = "0000000000000000000000000000000000000000000000000000000000000000";

fn entry_hash(e: &Entry) -> String {
    let mut h = Sha256::new();
    h.update(b"nexus-audit-v1\0");
    let body = serde_json::json!([
        e.seq,
        e.ts,
        e.actor,
        e.kind,
        e.compartment,
        e.object,
        e.version,
        e.manifest_version,
        e.prev
    ]);
    h.update(body.to_string().as_bytes());
    hex::encode(h.finalize())
}

/// Registro en un archivo JSONL de sólo anexado.
pub struct AuditLog {
    path: PathBuf,
}

/// Datos de un evento nuevo.
pub struct NewEvent<'a> {
    pub ts: u64,
    pub actor: &'a str,
    pub kind: Kind,
    pub compartment: Option<String>,
    pub object: Option<String>,
    pub version: Option<u64>,
    pub manifest_version: Option<u64>,
}

impl AuditLog {
    /// Abre (o crea vacío) el registro.
    #[must_use]
    pub fn new(path: impl AsRef<Path>) -> Self {
        AuditLog {
            path: path.as_ref().to_path_buf(),
        }
    }

    /// Lee y verifica toda la cadena.
    ///
    /// # Errors
    /// [`Error::AuditTampered`] con la primera entrada inválida, o errores de lectura.
    pub fn verify(&self) -> Result<Vec<Entry>, Error> {
        let text = match fs::read_to_string(&self.path) {
            Ok(t) => t,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(e) => return Err(e.into()),
        };
        let mut prev = GENESIS.to_string();
        let mut out = Vec::new();
        for (i, line) in text.lines().enumerate() {
            let linea = i + 1;
            let e: Entry =
                serde_json::from_str(line).map_err(|_| Error::AuditTampered { linea })?;
            if e.seq != i as u64 || e.prev != prev || entry_hash(&e) != e.hash {
                return Err(Error::AuditTampered { linea });
            }
            prev = e.hash.clone();
            out.push(e);
        }
        Ok(out)
    }

    /// Añade un evento al final de la cadena (verifica la cadena antes).
    ///
    /// # Errors
    /// Si la cadena existente está alterada o falla la escritura.
    pub fn append(&self, ev: NewEvent<'_>) -> Result<Entry, Error> {
        let chain = self.verify()?;
        let prev = chain
            .last()
            .map_or_else(|| GENESIS.to_string(), |e| e.hash.clone());
        let mut e = Entry {
            seq: chain.len() as u64,
            ts: ev.ts,
            actor: ev.actor.to_owned(),
            kind: ev.kind,
            compartment: ev.compartment,
            object: ev.object,
            version: ev.version,
            manifest_version: ev.manifest_version,
            prev,
            hash: String::new(),
        };
        e.hash = entry_hash(&e);
        let mut f = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)?;
        let line = serde_json::to_string(&e).map_err(|_| Error::Corrupt("registro"))?;
        f.write_all(line.as_bytes())?;
        f.write_all(b"\n")?;
        f.sync_all()?;
        Ok(e)
    }
}
