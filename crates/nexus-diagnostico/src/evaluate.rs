//! Reglas de aptitud para NEXUS CUBE Desktop (ADR-0012 y docs/17).

use serde::Serialize;

use crate::facts::Facts;

/// Windows 11 empieza en la compilación 22000.
pub const WINDOWS_11_BUILD: u32 = 22_000;
/// Windows 10 empieza en la compilación 10240.
pub const WINDOWS_10_BUILD: u32 = 10_240;
/// Días máximos sin actualizaciones antes de recomendar actualizar.
pub const MAX_DAYS_WITHOUT_UPDATES: u32 = 45;

/// Estado de una comprobación.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    /// Cumple.
    Ok,
    /// Cumple tras una acción del equipo de TI.
    Accion,
    /// Impide instalar NEXUS CUBE.
    Bloqueante,
    /// No se pudo determinar.
    Desconocido,
}

/// Resultado de una comprobación.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Check {
    pub id: &'static str,
    pub titulo: &'static str,
    pub estado: Status,
    pub detalle: String,
    pub recomendacion: Option<String>,
}

/// Veredicto global del equipo.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Verdict {
    /// Listo para instalar.
    Apto,
    /// Apto tras completar las acciones indicadas.
    AptoConAcciones,
    /// No puede usar NEXUS CUBE (p. ej. sin TPM 2.0).
    NoApto,
    /// Faltan datos (p. ej. no se ejecutó como administrador).
    Incompleto,
}

impl Verdict {
    /// Texto para el informe.
    #[must_use]
    pub fn label(self) -> &'static str {
        match self {
            Verdict::Apto => "APTO",
            Verdict::AptoConAcciones => "APTO CON ACCIONES",
            Verdict::NoApto => "NO APTO",
            Verdict::Incompleto => "INCOMPLETO",
        }
    }
}

fn check(
    id: &'static str,
    titulo: &'static str,
    estado: Status,
    detalle: impl Into<String>,
    rec: Option<&str>,
) -> Check {
    Check {
        id,
        titulo,
        estado,
        detalle: detalle.into(),
        recomendacion: rec.map(str::to_owned),
    }
}

fn tpm(f: &Facts) -> Check {
    const T: &str = "TPM 2.0";
    let vm = if f.is_virtual() {
        " (máquina virtual: requiere TPM virtual, vTPM)"
    } else {
        ""
    };
    match (f.tpm_present, f.tpm_is_v2()) {
        (None, _) => check(
            "tpm",
            T,
            Status::Desconocido,
            "No se pudo leer el TPM",
            Some("Ejecutar la herramienta como administrador"),
        ),
        (Some(false), _) => check(
            "tpm",
            T,
            Status::Bloqueante,
            format!("No se detectó un TPM habilitado{vm}"),
            Some(
                "Si el procesador tiene fTPM (Intel PTT / AMD fTPM), activarlo en la BIOS/UEFI y volver a ejecutar. Si no lo tiene, el equipo debe reemplazarse",
            ),
        ),
        (Some(true), Some(false)) => check(
            "tpm",
            T,
            Status::Bloqueante,
            format!(
                "El TPM es de versión anterior a 2.0 ({}){vm}",
                f.tpm_spec.as_deref().unwrap_or("?")
            ),
            Some(
                "Algunos equipos permiten cambiar el TPM a modo 2.0 desde la BIOS; si no, reemplazar el equipo",
            ),
        ),
        (Some(true), None) => check(
            "tpm",
            T,
            Status::Desconocido,
            "TPM presente, versión desconocida",
            Some("Ejecutar como administrador"),
        ),
        (Some(true), Some(true)) => {
            let usable = f.tpm_enabled != Some(false)
                && f.tpm_activated != Some(false)
                && f.tpm_ready != Some(false);
            if usable {
                check(
                    "tpm",
                    T,
                    Status::Ok,
                    format!("TPM 2.0 presente y listo{vm}"),
                    None,
                )
            } else {
                check(
                    "tpm",
                    T,
                    Status::Accion,
                    format!("TPM 2.0 presente pero no está habilitado o listo{vm}"),
                    Some("Habilitar el TPM en la BIOS/UEFI o inicializarlo con tpm.msc"),
                )
            }
        }
    }
}

fn windows(f: &Facts) -> Check {
    const T: &str = "Windows";
    let name = f.os_caption.clone().unwrap_or_else(|| "Windows".into());
    match f.os_build {
        None => check(
            "windows",
            T,
            Status::Desconocido,
            "No se pudo leer la versión de Windows",
            None,
        ),
        Some(b) if b >= WINDOWS_11_BUILD => check(
            "windows",
            T,
            Status::Ok,
            format!("{name} (compilación {b})"),
            None,
        ),
        Some(b) if b >= WINDOWS_10_BUILD => check(
            "windows",
            T,
            Status::Accion,
            format!(
                "{name} (compilación {b}). Windows 10 no tiene soporte gratuito desde el 14 de octubre de 2025"
            ),
            Some(
                "Actualizar a Windows 11. Mientras tanto, el equipo no recibirá acceso a compartimentos sensibles salvo con actualizaciones de seguridad extendidas (ESU) vigentes",
            ),
        ),
        Some(b) => check(
            "windows",
            T,
            Status::Bloqueante,
            format!("{name} (compilación {b}) no es compatible"),
            Some("Reemplazar o reinstalar con Windows 11"),
        ),
    }
}

fn secure_boot(f: &Facts) -> Check {
    const T: &str = "Arranque seguro (Secure Boot)";
    match f.secure_boot {
        Some(true) => check("secure_boot", T, Status::Ok, "Activado", None),
        Some(false) => check(
            "secure_boot",
            T,
            Status::Accion,
            "Desactivado o arranque heredado (BIOS legacy)",
            Some("Activar UEFI y Secure Boot en la configuración del firmware"),
        ),
        None => check(
            "secure_boot",
            T,
            Status::Desconocido,
            "No se pudo determinar",
            Some("Ejecutar como administrador"),
        ),
    }
}

fn bitlocker(f: &Facts) -> Check {
    const T: &str = "Cifrado de disco (BitLocker)";
    match f.bitlocker_on {
        Some(true) => check(
            "bitlocker",
            T,
            Status::Ok,
            "Unidad del sistema protegida",
            None,
        ),
        Some(false) => check(
            "bitlocker",
            T,
            Status::Accion,
            "La unidad del sistema no está protegida",
            Some(
                "Activar BitLocker (NEXUS CUBE lo exige y custodiará la clave de recuperación con aprobación M-de-N)",
            ),
        ),
        None => check(
            "bitlocker",
            T,
            Status::Desconocido,
            "No se pudo determinar (requiere administrador; en ediciones Home puede no estar disponible)",
            Some("Ejecutar como administrador; en Windows Home, revisar «Cifrado de dispositivo»"),
        ),
    }
}

fn updates(f: &Facts) -> Check {
    const T: &str = "Actualizaciones de Windows";
    match f.last_update_days {
        Some(d) if d <= MAX_DAYS_WITHOUT_UPDATES => check(
            "updates",
            T,
            Status::Ok,
            format!("Última actualización hace {d} días"),
            None,
        ),
        Some(d) => check(
            "updates",
            T,
            Status::Accion,
            format!("Última actualización hace {d} días"),
            Some("Instalar las actualizaciones pendientes de Windows Update"),
        ),
        None => check(
            "updates",
            T,
            Status::Desconocido,
            "No se pudo determinar la última actualización",
            None,
        ),
    }
}

/// Aplica todas las reglas.
#[must_use]
pub fn evaluate(f: &Facts) -> (Verdict, Vec<Check>) {
    let checks = vec![tpm(f), windows(f), secure_boot(f), bitlocker(f), updates(f)];
    let has = |s: Status| checks.iter().any(|c| c.estado == s);
    let verdict = if has(Status::Bloqueante) {
        Verdict::NoApto
    } else if has(Status::Desconocido) {
        Verdict::Incompleto
    } else if has(Status::Accion) {
        Verdict::AptoConAcciones
    } else {
        Verdict::Apto
    };
    (verdict, checks)
}
