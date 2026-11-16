//! Datos del equipo tal como los devuelve `collect.ps1` (JSON). `None` = no se pudo leer.

use serde::{Deserialize, Serialize};

/// Datos brutos del equipo.
#[derive(Debug, Clone, Default, Deserialize, Serialize, PartialEq)]
#[serde(default)]
pub struct Facts {
    pub is_admin: Option<bool>,
    pub collected_at: Option<String>,
    pub hostname: Option<String>,
    pub os_caption: Option<String>,
    pub os_build: Option<u32>,
    pub os_version: Option<String>,
    pub manufacturer: Option<String>,
    pub model: Option<String>,
    pub tpm_present: Option<bool>,
    pub tpm_spec: Option<String>,
    pub tpm_enabled: Option<bool>,
    pub tpm_activated: Option<bool>,
    pub tpm_ready: Option<bool>,
    pub secure_boot: Option<bool>,
    pub bitlocker_on: Option<bool>,
    pub last_update_days: Option<u32>,
}

impl Facts {
    /// Interpreta la salida JSON de `collect.ps1`.
    ///
    /// # Errors
    /// Si la salida no es JSON válido.
    pub fn from_json(s: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(s.trim().trim_start_matches('\u{feff}'))
    }

    /// `true` si `SpecVersion` indica TPM 2.0 (p. ej. `"2.0, 0, 1.38"`).
    #[must_use]
    pub fn tpm_is_v2(&self) -> Option<bool> {
        self.tpm_spec
            .as_deref()
            .map(|s| s.trim_start().starts_with("2.0"))
    }

    /// Heurística de máquina virtual (fabricante/modelo conocidos).
    #[must_use]
    pub fn is_virtual(&self) -> bool {
        let text = format!(
            "{} {}",
            self.manufacturer.as_deref().unwrap_or_default(),
            self.model.as_deref().unwrap_or_default()
        )
        .to_lowercase();
        [
            "virtual machine",
            "vmware",
            "virtualbox",
            "kvm",
            "qemu",
            "hyper-v",
            "xen",
            "parallels",
        ]
        .iter()
        .any(|k| text.contains(k))
    }
}
