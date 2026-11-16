//! # nexus-envelope
//!
//! Cifrado de objetos de NEXUS VAULT con **envoltura de claves** (*envelope encryption*),
//! formato `NCOBJ v1` (ver `docs/02-especificacion-criptografica.md` §2.4).
//!
//! **Prototipo de Fase 1. No auditado. No usar con datos reales.**
//!
//! Propiedades que este crate intenta garantizar (y que sus pruebas verifican):
//! - Cada objeto/versión se cifra con una **clave de datos (DEK) nueva y única**, AES-256-GCM.
//! - La DEK sólo se guarda **envuelta** por una clave de compartimento (KEK) que nunca sale del
//!   [`KeyWrapper`] (en producción, un HSM/KMS).
//! - El texto cifrado queda **vinculado a su contexto** (organización, compartimento, objeto,
//!   versión): mover un objeto a otra organización o hacer *rollback* de versión se detecta.
//! - La KEK se puede **rotar sin volver a cifrar los datos** ([`rewrap`]).
//! - Suites o versiones de formato desconocidas se **rechazan** (no hay degradación silenciosa).
//! - El parser nunca entra en pánico con entradas arbitrarias.
//! - Las claves se borran de memoria al liberarse ([`zeroize`]) y no se imprimen en `Debug`.
//!
//! No se implementa ninguna primitiva criptográfica: se usan las de `RustCrypto`.

#![forbid(unsafe_code)]
#![deny(missing_docs)]

mod envelope;
mod error;
mod format;
mod kek;

pub use envelope::{MAX_PLAINTEXT_LEN, open, read_header, rewrap, seal};
pub use error::Error;
pub use format::{FORMAT_VERSION, Header, MAGIC, ObjectContext, SuiteId};
pub use kek::{Dek, KekId, KeyWrapper, SoftwareKek};
