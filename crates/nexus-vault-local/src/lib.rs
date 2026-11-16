//! # nexus-vault-local
//!
//! Almacén local cifrado de NEXUS CUBE Desktop (docs/17, docs/07). Usa `nexus-envelope` para cifrar.
//!
//! **Prototipo. No auditado. No usar con datos reales.** El almacén de claves disponible
//! ([`DevFileKeyStore`]) es sólo para desarrollo; el definitivo usará TPM 2.0 (ADR-0012).
#![forbid(unsafe_code)]

pub mod audit;
mod error;
mod ids;
pub mod keystore;
mod vault;

pub use error::Error;
pub use ids::Id;
pub use keystore::{DevFileKeyStore, KeyStore};
pub use vault::{
    CompartmentKind, CompartmentSummary, FileSummary, RestoreReport, Vault, VersionInfo,
};
