//! Prueba de extremo a extremo del ejecutable con datos guardados (sin Windows).

use std::process::Command;

fn bin() -> Command {
    Command::new(env!("CARGO_BIN_EXE_nexus-diagnostico"))
}

#[test]
fn ejemplo_firma_de_abogados_y_consolidado() {
    let dir = std::env::temp_dir().join(format!("nexus-diag-{}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    let fixtures = format!("{}/tests/fixtures", env!("CARGO_MANIFEST_DIR"));
    for name in [
        "win11_ok",
        "win10_tpm_off",
        "win10_tpm_disabled",
        "tpm12",
        "no_admin",
        "vm_vtpm",
        "github_runner_server",
    ] {
        let out = bin()
            .args([
                "--desde-json",
                &format!("{fixtures}/{name}.json"),
                "--sin-abrir",
                "--salida",
                dir.join(format!("{name}.json")).to_str().unwrap(),
            ])
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{name}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        assert!(String::from_utf8_lossy(&out.stdout).contains("VEREDICTO:"));
    }
    let out = bin()
        .args(["--consolidar", dir.to_str().unwrap()])
        .output()
        .unwrap();
    let text = String::from_utf8_lossy(&out.stdout);
    assert!(out.status.success());
    assert!(text.contains("Equipos analizados: 7"), "{text}");
    let csv = std::fs::read_to_string(dir.join("nexus-diagnostico-consolidado.csv")).unwrap();
    assert_eq!(csv.lines().count(), 8);
    println!("{text}\n{csv}");
    std::fs::remove_dir_all(&dir).ok();
}

#[test]
fn fuera_de_windows_falla_con_mensaje_claro() {
    if cfg!(windows) {
        return;
    }
    let out = bin().arg("--sin-archivo").output().unwrap();
    assert_eq!(out.status.code(), Some(2));
    assert!(String::from_utf8_lossy(&out.stderr).contains("sólo funciona en Windows"));
}
