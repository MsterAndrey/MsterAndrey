//! Ejecuta `collect.ps1` con el PowerShell del sistema y devuelve sus datos.

use crate::facts::Facts;

/// Script de recogida, incluido en el binario (se puede leer en `src/collect.ps1`).
pub const SCRIPT: &str = include_str!("collect.ps1");

/// Codifica el script como lo espera `powershell.exe -EncodedCommand` (UTF-16LE + Base64).
#[must_use]
pub fn encode_command(script: &str) -> String {
    let bytes: Vec<u8> = script.encode_utf16().flat_map(u16::to_le_bytes).collect();
    base64(&bytes)
}

fn base64(input: &[u8]) -> String {
    const A: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(input.len().div_ceil(3) * 4);
    for chunk in input.chunks(3) {
        let b = [
            chunk[0],
            *chunk.get(1).unwrap_or(&0),
            *chunk.get(2).unwrap_or(&0),
        ];
        let n = (u32::from(b[0]) << 16) | (u32::from(b[1]) << 8) | u32::from(b[2]);
        for i in 0..4 {
            if i <= chunk.len() {
                out.push(char::from(A[((n >> (18 - 6 * i)) & 63) as usize]));
            } else {
                out.push('=');
            }
        }
    }
    out
}

/// Recoge los datos del equipo.
///
/// # Errors
/// Si no se ejecuta en Windows o PowerShell falla.
#[cfg(windows)]
pub fn collect() -> Result<Facts, String> {
    use std::process::Command;
    // Ruta absoluta: evita ejecutar un `powershell.exe` falso colocado en el PATH.
    let root = std::env::var("SystemRoot").unwrap_or_else(|_| r"C:\Windows".into());
    let exe = format!(r"{root}\System32\WindowsPowerShell\v1.0\powershell.exe");
    let out = Command::new(exe)
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-EncodedCommand",
            &encode_command(SCRIPT),
        ])
        .output()
        .map_err(|e| format!("no se pudo ejecutar PowerShell: {e}"))?;
    if !out.status.success() {
        return Err(format!("PowerShell terminó con error ({})", out.status));
    }
    let stdout = String::from_utf8_lossy(&out.stdout);
    Facts::from_json(&stdout).map_err(|e| format!("respuesta de PowerShell no válida: {e}"))
}

/// Recoge los datos del equipo.
///
/// # Errors
/// Siempre, fuera de Windows.
#[cfg(not(windows))]
pub fn collect() -> Result<Facts, String> {
    Err("esta herramienta sólo funciona en Windows; usa --desde-json para probarla con datos guardados".into())
}
