//! NEXUS CUBE Desktop: puente entre la interfaz (webview) y el motor cifrado.
//!
//! Reglas:
//! - La interfaz nunca recibe claves: sólo nombres, versiones y resultados.
//! - Las operaciones sensibles (desbloquear, restaurar) piden Windows Hello **aquí, en Rust**,
//!   no en la interfaz: una interfaz manipulada no puede saltarse la confirmación.
//! - Las claves de carpeta se protegen con el TPM 2.0 (sin alternativa en archivo).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use nexus_tpm::{HelloResult, TpmKeyStore};
use nexus_vault_local::{CompartmentKind, Error as VaultError, Id, Vault};
use serde::Serialize;
use tauri::{Manager, State, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

/// Tamaño máximo por archivo en esta versión (cifrado en memoria).
const MAX_FILE: u64 = 256 * 1024 * 1024;

struct AppState {
    vault: Mutex<Option<Vault<TpmKeyStore>>>,
}

#[derive(Serialize)]
struct Session {
    usuario: String,
    organizacion: String,
}

#[derive(Serialize)]
struct CompartmentDto {
    id: String,
    tipo: &'static str,
    nombre: String,
    archivos: usize,
}

#[derive(Serialize)]
struct FileDto {
    nombre: String,
    version: u64,
    versiones: usize,
    modificado: u64,
    autor: String,
    tamano: u64,
}

#[derive(Serialize)]
struct EventDto {
    id: String,
    cuando: u64,
    quien: String,
    que: String,
    categoria: &'static str,
    recibo: u64,
}

#[derive(Serialize)]
struct RestoreDto {
    restaurados: usize,
    no_presentes: usize,
    carpeta: String,
    ubicacion: String,
}

#[derive(Serialize)]
struct AuditDto {
    entradas: usize,
    detalle: String,
}

fn e2s(e: VaultError) -> String {
    e.to_string()
}

fn kind_str(k: CompartmentKind) -> &'static str {
    match k {
        CompartmentKind::Cliente => "cliente",
        CompartmentKind::Caso => "caso",
    }
}

fn parse_id(s: &str) -> Result<Id, String> {
    Id::try_from(s.to_owned()).map_err(|_| "identificador de carpeta inválido".to_string())
}

#[cfg(windows)]
fn hwnd_of(w: &WebviewWindow) -> Result<isize, String> {
    w.hwnd().map(|h| h.0 as isize).map_err(|e| e.to_string())
}
#[cfg(not(windows))]
fn hwnd_of(_: &WebviewWindow) -> Result<isize, String> {
    Err("sólo disponible en Windows".into())
}

/// Pide Windows Hello sobre la ventana de la aplicación, en un hilo de fondo.
async fn require_hello(window: &WebviewWindow, message: String) -> Result<(), String> {
    let hwnd = hwnd_of(window)?;
    let r = tauri::async_runtime::spawn_blocking(move || nexus_tpm::windows_hello_for_window(hwnd, &message))
        .await
        .map_err(|e| e.to_string())?
        .map_err(e2s)?;
    match r {
        HelloResult::Verified => Ok(()),
        HelloResult::Canceled => Err("Verificación cancelada.".into()),
        HelloResult::NotAvailable => Err("Windows Hello no está configurado en este equipo. Configúralo en Configuración › Cuentas › Opciones de inicio de sesión.".into()),
        HelloResult::Failed => Err("Windows Hello no pudo verificar tu identidad.".into()),
    }
}

fn data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path().app_local_data_dir().map_err(|e| e.to_string())
}

fn with_vault<T>(state: &State<'_, AppState>, f: impl FnOnce(&Vault<TpmKeyStore>) -> Result<T, VaultError>) -> Result<T, String> {
    let guard = state.vault.lock().map_err(|_| "estado interno no disponible".to_string())?;
    let v = guard.as_ref().ok_or_else(|| "NEXUS CUBE está bloqueado".to_string())?;
    f(v).map_err(e2s)
}

#[tauri::command]
async fn unlock(app: tauri::AppHandle, window: WebviewWindow, state: State<'_, AppState>) -> Result<Session, String> {
    require_hello(&window, "Desbloquear NEXUS CUBE en este equipo".into()).await?;
    let dir = data_dir(&app)?;
    let usuario = std::env::var("USERNAME").unwrap_or_else(|_| "Usuario".into());
    let actor = usuario.clone();
    let vault = tauri::async_runtime::spawn_blocking(move || -> Result<Vault<TpmKeyStore>, VaultError> {
        let keys = TpmKeyStore::open(dir.join("keys"))?;
        let root = dir.join("vault");
        if root.join("vault.json").exists() { Vault::open(root, keys, &actor) } else { Vault::create(root, keys, &actor) }
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(e2s)?;
    *state.vault.lock().map_err(|_| "estado interno no disponible".to_string())? = Some(vault);
    Ok(Session { usuario, organizacion: "Este equipo".into() })
}

#[tauri::command]
fn lock(state: State<'_, AppState>) -> Result<(), String> {
    *state.vault.lock().map_err(|_| "estado interno no disponible".to_string())? = None;
    Ok(())
}

#[tauri::command]
fn list_compartments(state: State<'_, AppState>) -> Result<Vec<CompartmentDto>, String> {
    with_vault(&state, |v| {
        Ok(v.compartments()?
            .into_iter()
            .map(|c| CompartmentDto { id: c.id.hex(), tipo: kind_str(c.kind), nombre: c.name, archivos: c.files })
            .collect())
    })
}

#[tauri::command]
fn create_compartment(state: State<'_, AppState>, nombre: String, tipo: String) -> Result<CompartmentDto, String> {
    let kind = if tipo == "cliente" { CompartmentKind::Cliente } else { CompartmentKind::Caso };
    with_vault(&state, |v| {
        let id = v.create_compartment(nombre.trim(), kind)?;
        Ok(CompartmentDto { id: id.hex(), tipo: kind_str(kind), nombre: nombre.trim().to_owned(), archivos: 0 })
    })
}

#[tauri::command]
fn list_files(state: State<'_, AppState>, id: String) -> Result<Vec<FileDto>, String> {
    let id = parse_id(&id)?;
    with_vault(&state, |v| {
        Ok(v.files(&id)?
            .into_iter()
            .filter_map(|f| {
                let last = f.versions.last()?.clone();
                Some(FileDto { nombre: f.name, version: last.n, versiones: f.versions.len(), modificado: last.created_at, autor: last.author, tamano: last.size })
            })
            .collect())
    })
}

/// Abre el selector de archivos de Windows y cifra los elegidos en la carpeta.
/// Los originales no se borran: la persona decide qué hacer con ellos.
#[tauri::command]
async fn add_files(app: tauri::AppHandle, state: State<'_, AppState>, id: String) -> Result<usize, String> {
    let id = parse_id(&id)?;
    let picked = app.dialog().file().set_title("Elige los archivos que quieres proteger").blocking_pick_files();
    let Some(paths) = picked else { return Ok(0) };
    let mut added = 0;
    for p in paths {
        let path = p.into_path().map_err(|e| e.to_string())?;
        let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).ok_or("archivo sin nombre")?;
        let size = std::fs::metadata(&path).map_err(|e| e.to_string())?.len();
        if size > MAX_FILE {
            return Err(format!("«{name}» supera el tamaño máximo de esta versión (256 MB)."));
        }
        let bytes = zeroize::Zeroizing::new(std::fs::read(&path).map_err(|e| e.to_string())?);
        with_vault(&state, |v| v.put(&id, &name, &bytes))?;
        added += 1;
    }
    Ok(added)
}

fn sanitize(name: &str) -> String {
    name.chars().map(|c| if c.is_alphanumeric() || " -_·.()".contains(c) { c } else { '_' }).collect::<String>().trim().to_owned()
}

/// Restaura una carpeta al instante `at` (segundos UNIX) en una carpeta nueva dentro de Documentos.
/// Pide Windows Hello antes de descifrar nada.
#[tauri::command]
async fn restore_at(
    app: tauri::AppHandle,
    window: WebviewWindow,
    state: State<'_, AppState>,
    id: String,
    at: u64,
    etiqueta: String,
) -> Result<RestoreDto, String> {
    let cid = parse_id(&id)?;
    let nombre = with_vault(&state, |v| {
        Ok(v.compartments()?.into_iter().find(|c| c.id == cid).map(|c| c.name))
    })?
    .ok_or("la carpeta no existe")?;
    require_hello(&window, format!("Restaurar «{nombre}» al estado del {etiqueta} en una carpeta nueva")).await?;

    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    let carpeta = format!("{} ({})", sanitize(&nombre), sanitize(&etiqueta.replace(':', "h")));
    let dest = docs.join("NEXUS CUBE - Restaurado").join(&carpeta);
    let report = with_vault(&state, |v| v.restore(&cid, at, &dest))?;
    Ok(RestoreDto {
        restaurados: report.restored.len(),
        no_presentes: report.not_present.len(),
        carpeta,
        ubicacion: dest.display().to_string(),
    })
}

/// Abre en el Explorador una carpeta de recuperación (sólo dentro de la carpeta de restauraciones).
#[tauri::command]
fn reveal(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let base = app.path().document_dir().map_err(|e| e.to_string())?.join("NEXUS CUBE - Restaurado");
    let target = Path::new(&path).canonicalize().map_err(|e| e.to_string())?;
    let base = base.canonicalize().map_err(|e| e.to_string())?;
    if !target.starts_with(&base) {
        return Err("ruta no permitida".into());
    }
    #[cfg(windows)]
    {
        let root = std::env::var("SystemRoot").unwrap_or_else(|_| r"C:\Windows".into());
        std::process::Command::new(format!(r"{root}\explorer.exe")).arg(&target).spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn activity(state: State<'_, AppState>) -> Result<Vec<EventDto>, String> {
    with_vault(&state, |v| {
        let comps = v.compartments()?;
        let mut cname: HashMap<String, String> = HashMap::new();
        let mut oname: HashMap<String, String> = HashMap::new();
        for c in &comps {
            cname.insert(c.id.hex(), c.name.clone());
            for f in v.files(&c.id)? {
                oname.insert(f.object.hex(), f.name);
            }
        }
        let name = |m: &HashMap<String, String>, k: &Option<String>| k.as_ref().and_then(|k| m.get(k)).cloned().unwrap_or_else(|| "—".into());
        use nexus_vault_local::audit::Kind;
        let mut out: Vec<EventDto> = v
            .audit()?
            .into_iter()
            .map(|e| {
                let (que, categoria) = match e.kind {
                    Kind::VaultCreated => ("Se creó el almacén cifrado en este equipo".to_string(), "seguridad"),
                    Kind::CompartmentCreated => (format!("Creó la carpeta «{}»", name(&cname, &e.compartment)), "seguridad"),
                    Kind::VersionWritten => (
                        format!("Guardó «{}» (versión {}) en «{}»", name(&oname, &e.object), e.version.unwrap_or(0), name(&cname, &e.compartment)),
                        "acceso",
                    ),
                    Kind::VersionRead => (format!("Abrió «{}» en «{}»", name(&oname, &e.object), name(&cname, &e.compartment)), "acceso"),
                    Kind::Restored => (format!("Restauró «{}» en una carpeta nueva", name(&cname, &e.compartment)), "copia"),
                };
                EventDto { id: e.seq.to_string(), cuando: e.ts, quien: e.actor, que, categoria, recibo: e.seq }
            })
            .collect();
        out.reverse();
        Ok(out)
    })
}

#[tauri::command]
fn verify_audit(state: State<'_, AppState>) -> Result<AuditDto, String> {
    with_vault(&state, |v| {
        let entries = v.audit()?;
        let last = entries.last().map(|e| e.hash[..12].to_string()).unwrap_or_default();
        Ok(AuditDto { entradas: entries.len(), detalle: format!("cadena local íntegra · último hash {last}…") })
    })
}

#[tauri::command]
async fn device_status() -> Result<serde_json::Value, String> {
    let facts = tauri::async_runtime::spawn_blocking(nexus_diagnostico::collect::collect)
        .await
        .map_err(|e| e.to_string())??;
    let report = nexus_diagnostico::report::Report::new(&facts, false);
    Ok(serde_json::json!({
        "equipo": report.equipo,
        "windows": report.sistema.unwrap_or_else(|| "Windows".into()),
        "checks": report.comprobaciones,
        "ultimaSincronizacion": "sólo local (sin servidor en esta versión)",
        "modoSinConexionHasta": null
    }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState { vault: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![
            unlock,
            lock,
            list_compartments,
            create_compartment,
            list_files,
            add_files,
            restore_at,
            reveal,
            activity,
            verify_audit,
            device_status
        ])
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar NEXUS CUBE");
}
