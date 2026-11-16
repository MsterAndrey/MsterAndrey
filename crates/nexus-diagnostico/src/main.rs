use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use nexus_diagnostico::{collect, facts::Facts, report};

const HELP: &str = "\
nexus-diagnostico — comprueba si este equipo puede usar NEXUS CUBE.
Sólo lectura. No usa la red. Ejecutar como administrador para un resultado completo.

USO:
  nexus-diagnostico [--anonimo] [--salida <archivo.json>]
  nexus-diagnostico --consolidar <carpeta>      (une los .json de varios equipos en un CSV)
  nexus-diagnostico --desde-json <archivo>      (evalúa datos guardados; útil para pruebas)

OPCIONES:
  --anonimo      No incluye el nombre ni el modelo del equipo en el informe
  --salida       Ruta del informe JSON (por defecto: nexus-diagnostico-<equipo>.json)
  --sin-archivo  Sólo muestra el resultado en pantalla
";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
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
    if !flag("--sin-archivo") {
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
        let path = value("--salida").map_or_else(
            || PathBuf::from(format!("nexus-diagnostico-{safe}.json")),
            PathBuf::from,
        );
        match rep
            .to_json()
            .map_err(|e| e.to_string())
            .and_then(|j| fs::write(&path, j).map_err(|e| e.to_string()))
        {
            Ok(()) => println!("Informe guardado en: {}", path.display()),
            Err(e) => {
                eprintln!("No se pudo guardar el informe: {e}");
                return ExitCode::from(2);
            }
        }
    }
    ExitCode::SUCCESS
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
