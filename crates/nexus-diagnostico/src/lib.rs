//! # nexus-diagnostico
//!
//! Comprueba si un equipo Windows cumple los requisitos de NEXUS CUBE Desktop
//! (ADR-0012: TPM 2.0 obligatorio; Windows 11; Secure Boot; BitLocker; actualizaciones).
//!
//! - **Sólo lectura:** no cambia ninguna configuración.
//! - **Sin red:** no tiene dependencias de red y el script de recogida no usa cmdlets de red.
//! - **Sin datos personales:** no lee usuarios, archivos ni números de serie.
#![forbid(unsafe_code)]

pub mod collect;
pub mod evaluate;
pub mod facts;
pub mod html;
pub mod report;
