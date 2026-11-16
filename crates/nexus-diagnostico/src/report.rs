//! Informe por equipo (texto y JSON) y consolidado de varios equipos (CSV).

use serde::{Deserialize, Serialize};

use crate::evaluate::{Check, Status, Verdict, evaluate};
use crate::facts::Facts;

/// Informe de un equipo. No contiene usuarios, números de serie ni archivos.
#[derive(Debug, Clone, Serialize)]
pub struct Report {
    pub herramienta: &'static str,
    pub version: &'static str,
    pub fecha: Option<String>,
    pub equipo: String,
    pub sistema: Option<String>,
    pub modelo: Option<String>,
    pub veredicto: Verdict,
    pub comprobaciones: Vec<Check>,
}

impl Report {
    /// Construye el informe. Con `anonimo`, el nombre del equipo se sustituye por un identificador genérico.
    #[must_use]
    pub fn new(f: &Facts, anonimo: bool) -> Self {
        let (veredicto, comprobaciones) = evaluate(f);
        let equipo = if anonimo {
            "equipo-anonimo".into()
        } else {
            f.hostname.clone().unwrap_or_else(|| "desconocido".into())
        };
        let modelo = match (&f.manufacturer, &f.model) {
            // Evita «HP HP ProDesk» cuando el modelo ya empieza por el fabricante.
            (Some(a), Some(b)) if b.to_lowercase().starts_with(&a.to_lowercase()) => {
                Some(b.clone())
            }
            (Some(a), Some(b)) => Some(format!("{a} {b}")),
            (a, b) => a.clone().or_else(|| b.clone()),
        };
        Report {
            herramienta: "nexus-diagnostico",
            version: env!("CARGO_PKG_VERSION"),
            fecha: f.collected_at.clone(),
            equipo,
            sistema: f.os_caption.clone(),
            modelo: if anonimo { None } else { modelo },
            veredicto,
            comprobaciones,
        }
    }

    /// Informe legible.
    #[must_use]
    pub fn to_text(&self) -> String {
        let mut s = String::new();
        s.push_str("NEXUS CUBE · Diagnóstico de equipo\n");
        s.push_str("Sólo lectura · sin conexión a red · ningún dato sale de este equipo\n\n");
        s.push_str(&format!("Equipo:     {}\n", self.equipo));
        if let Some(m) = &self.modelo {
            s.push_str(&format!("Modelo:     {m}\n"));
        }
        if let Some(d) = &self.fecha {
            s.push_str(&format!("Fecha:      {d}\n"));
        }
        s.push_str(&format!("\nVEREDICTO:  {}\n\n", self.veredicto.label()));
        for c in &self.comprobaciones {
            let mark = match c.estado {
                Status::Ok => "[OK]      ",
                Status::Accion => "[ACCIÓN]  ",
                Status::Bloqueante => "[BLOQUEA] ",
                Status::Desconocido => "[?]       ",
            };
            s.push_str(&format!("{mark}{}: {}\n", c.titulo, c.detalle));
            if let Some(r) = &c.recomendacion {
                s.push_str(&format!("          → {r}\n"));
            }
        }
        s
    }

    /// Informe JSON (para consolidar).
    ///
    /// # Errors
    /// No debería fallar; se propaga el error de serialización.
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}

/// Subconjunto de un informe JSON necesario para consolidar.
#[derive(Debug, Deserialize)]
pub struct StoredReport {
    pub equipo: String,
    pub veredicto: String,
    pub comprobaciones: Vec<StoredCheck>,
}

/// Comprobación leída de un informe JSON.
#[derive(Debug, Deserialize)]
pub struct StoredCheck {
    pub id: String,
    pub estado: String,
}

const CSV_COLUMNS: [&str; 5] = ["tpm", "windows", "secure_boot", "bitlocker", "updates"];

/// Escapa un campo CSV y neutraliza fórmulas (evita inyección al abrirlo en Excel).
fn csv_field(v: &str) -> String {
    let v = if v.starts_with(['=', '+', '-', '@', '\t', '\r']) {
        format!("'{v}")
    } else {
        v.to_owned()
    };
    if v.contains([',', '"', '\n', '\r']) {
        format!("\"{}\"", v.replace('"', "\"\""))
    } else {
        v
    }
}

/// Consolida varios informes en un CSV y un resumen por veredicto.
#[must_use]
pub fn consolidate(reports: &[StoredReport]) -> (String, String) {
    let mut csv = format!("equipo,veredicto,{}\n", CSV_COLUMNS.join(","));
    let mut counts: Vec<(String, usize)> = Vec::new();
    for r in reports {
        let estado = |id: &str| {
            r.comprobaciones
                .iter()
                .find(|c| c.id == id)
                .map_or("", |c| c.estado.as_str())
                .to_owned()
        };
        let cols: Vec<String> = CSV_COLUMNS.iter().map(|c| csv_field(&estado(c))).collect();
        csv.push_str(&format!(
            "{},{},{}\n",
            csv_field(&r.equipo),
            csv_field(&r.veredicto),
            cols.join(",")
        ));
        match counts.iter_mut().find(|(v, _)| *v == r.veredicto) {
            Some((_, n)) => *n += 1,
            None => counts.push((r.veredicto.clone(), 1)),
        }
    }
    let mut summary = format!("Equipos analizados: {}\n", reports.len());
    for (v, n) in counts {
        summary.push_str(&format!("  {v}: {n}\n"));
    }
    (csv, summary)
}
