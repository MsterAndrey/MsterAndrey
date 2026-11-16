use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use nexus_diagnostico::{collect, facts::Facts, html, report};

const HELP: &str = "\
nexus-diagnostico — comprueba si este equipo puede usar NEXUS CUBE.
Sólo lectura. No usa la red. En Windows pide permisos de administrador al abrirse.

USO:
  Doble clic sobre el programa: analiza el equipo y abre el informe visual.
  nexus-diagnostico [--anonimo] [--salida <archivo.json>] [--sin-abrir]
  nexus-diagnostico --consolidar <carpeta>      (une los .json de varios equipos en un CSV)
  nexus-diagnostico --desde-json <archivo>      (evalúa datos guardados; útil para pruebas)

OPCIONES:
  --anonimo      No incluye el nombre ni el modelo del equipo en el informe
  --salida       Ruta del informe JSON (por defecto: nexus-diagnostico-<equipo>.json).
                 El informe visual se guarda junto a él, con extensión .html
  --sin-abrir    No abre el informe visual en el navegador
  --sin-archivo  Sólo muestra el resultado en pantalla
";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    // Sin argumentos = abierto con doble clic: al final se espera a que el usuario cierre la ventana.
    let interactive = args.is_empty();
    let code = run(&args);
    if interactive {
        pause();
    }
    code
}

fn run(args: &[String]) -> ExitCode {
    let flag = |f: &str| args.iter().any(|a| a == f);
    let value = |f: &str| {
        args.iter()
            .position(|a| a == f)
            .and_then(|i| args.get(i + 1))
            .cloned()
    };

    if flag("--ayuda") || flag("--help") || flag("-h") {
        print!("{HELP}");
        return ExitCode::SUCCESS;
    }
    if let Some(dir) = value("--consolidar") {
        return consolidate(Path::new(&dir));
    }

    println!("NEXUS CUBE · analizando este equipo (sólo lectura, sin red)…\n");
    let facts = match value("--desde-json") {
        Some(p) => fs::read_to_string(&p)
            .map_err(|e| e.to_string())
            .and_then(|s| Facts::from_json(&s).map_err(|e| e.to_string())),
        None => collect::collect(),
    };
    let facts = match facts {
        Ok(f) => f,
        Err(e) => {
            eprintln!("Error: {e}");
            return ExitCode::from(2);
        }
    };

    let rep = report::Report::new(&facts, flag("--anonimo"));
    println!("{}", rep.to_text());
    if facts.is_admin == Some(false) {
        println!("Aviso: no se ejecutó como administrador; algunos datos no se pudieron leer.");
    }
    if flag("--sin-archivo") {
        return ExitCode::SUCCESS;
    }

    let safe: String = rep
        .equipo
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect();
    let json_path = value("--salida").map_or_else(
        || PathBuf::from(format!("nexus-diagnostico-{safe}.json")),
        PathBuf::from,
    );
    let html_path = json_path.with_extension("html");

    let written = rep
        .to_json()
        .map_err(|e| e.to_string())
        .and_then(|j| fs::write(&json_path, j).map_err(|e| e.to_string()))
        .and_then(|()| fs::write(&html_path, html::render(&rep)).map_err(|e| e.to_string()));
    if let Err(e) = written {
        eprintln!("No se pudo guardar el informe: {e}");
        return ExitCode::from(2);
    }
    println!("Informe para consolidar: {}", json_path.display());
    println!("Informe visual:          {}", html_path.display());

    if !flag("--sin-abrir") {
        open_in_browser(&html_path);
    }
    ExitCode::SUCCESS
}

/// Abre el informe con el navegador predeterminado (sólo Windows).
#[cfg(windows)]
fn open_in_browser(path: &Path) {
    // Ruta absoluta del Explorador de Windows: evita ejecutar un programa homónimo del PATH.
    let root = std::env::var("SystemRoot").unwrap_or_else(|_| r"C:\Windows".into());
    let target = fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    if std::process::Command::new(format!(r"{root}\explorer.exe"))
        .arg(&target)
        .spawn()
        .is_err()
    {
        println!("Abra el informe visual manualmente: {}", target.display());
    }
}

#[cfg(not(windows))]
fn open_in_browser(_path: &Path) {}

/// Mantiene abierta la ventana de consola cuando el programa se abrió con doble clic.
fn pause() {
    if cfg!(windows) {
        println!("\nPulse Enter para cerrar esta ventana.");
        let mut line = String::new();
        let _ = std::io::stdin().read_line(&mut line);
    }
}

fn consolidate(dir: &Path) -> ExitCode {
    let Ok(entries) = fs::read_dir(dir) else {
        eprintln!("No se puede leer la carpeta {}", dir.display());
        return ExitCode::from(2);
    };
    let mut reports = Vec::new();
    for e in entries.flatten() {
        let p = e.path();
        if p.extension().is_some_and(|x| x == "json") {
            match fs::read_to_string(&p)
                .ok()
                .and_then(|s| serde_json::from_str::<report::StoredReport>(&s).ok())
            {
                Some(r) => reports.push(r),
                None => eprintln!("Ignorado (no es un informe válido): {}", p.display()),
            }
        }
    }
    reports.sort_by(|a, b| a.equipo.cmp(&b.equipo));
    let (csv, summary) = report::consolidate(&reports);
    let out = dir.join("nexus-diagnostico-consolidado.csv");
    if let Err(e) = fs::write(&out, csv) {
        eprintln!("No se pudo escribir {}: {e}", out.display());
        return ExitCode::from(2);
    }
    print!("{summary}");
    println!("CSV: {}", out.display());
    ExitCode::SUCCESS
}
