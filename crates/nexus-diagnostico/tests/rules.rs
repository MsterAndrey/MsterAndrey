use nexus_diagnostico::evaluate::{Status, Verdict, evaluate};
use nexus_diagnostico::facts::Facts;

fn load(name: &str) -> Facts {
    let path = format!("{}/tests/fixtures/{name}.json", env!("CARGO_MANIFEST_DIR"));
    Facts::from_json(&std::fs::read_to_string(path).unwrap()).unwrap()
}

fn status(f: &Facts, id: &str) -> Status {
    evaluate(f)
        .1
        .into_iter()
        .find(|c| c.id == id)
        .unwrap()
        .estado
}

#[test]
fn windows_11_completo_es_apto() {
    let f = load("win11_ok");
    assert_eq!(evaluate(&f).0, Verdict::Apto);
}

#[test]
fn sin_tpm_no_es_apto() {
    let f = load("win10_tpm_off");
    assert_eq!(status(&f, "tpm"), Status::Bloqueante);
    assert_eq!(evaluate(&f).0, Verdict::NoApto);
}

#[test]
fn tpm_2_desactivado_requiere_accion() {
    let f = load("win10_tpm_disabled");
    assert_eq!(status(&f, "tpm"), Status::Accion);
    assert_eq!(status(&f, "windows"), Status::Accion);
    assert_eq!(evaluate(&f).0, Verdict::AptoConAcciones);
}

#[test]
fn tpm_1_2_no_es_apto() {
    let f = load("tpm12");
    assert_eq!(f.tpm_is_v2(), Some(false));
    assert_eq!(status(&f, "tpm"), Status::Bloqueante);
    assert_eq!(evaluate(&f).0, Verdict::NoApto);
}

#[test]
fn sin_administrador_el_resultado_es_incompleto() {
    let f = load("no_admin");
    assert_eq!(status(&f, "tpm"), Status::Desconocido);
    assert_eq!(evaluate(&f).0, Verdict::Incompleto);
}

#[test]
fn maquina_virtual_con_vtpm_es_apta_y_se_indica() {
    let f = load("vm_vtpm");
    assert!(f.is_virtual());
    let (v, checks) = evaluate(&f);
    assert_eq!(v, Verdict::Apto);
    assert!(checks[0].detalle.contains("vTPM"));
}

#[test]
fn datos_vacios_no_dan_apto() {
    let (v, _) = evaluate(&Facts::default());
    assert_eq!(v, Verdict::Incompleto);
}

#[test]
fn limites_de_version_de_windows() {
    let mut f = load("win11_ok");
    f.os_build = Some(21_999);
    assert_eq!(status(&f, "windows"), Status::Accion);
    f.os_build = Some(22_000);
    assert_eq!(status(&f, "windows"), Status::Ok);
    f.os_build = Some(9_600); // Windows 8.1
    assert_eq!(status(&f, "windows"), Status::Bloqueante);
}

#[test]
fn salida_con_bom_de_powershell_se_acepta() {
    let s = format!(
        "\u{feff}{}\r\n",
        std::fs::read_to_string(format!(
            "{}/tests/fixtures/win11_ok.json",
            env!("CARGO_MANIFEST_DIR")
        ))
        .unwrap()
    );
    assert!(Facts::from_json(&s).is_ok());
}

/// Caso real: máquina virtual de GitHub Actions (Windows Server 2025, sin vTPM).
#[test]
fn windows_server_y_vm_sin_vtpm() {
    let f = load("github_runner_server");
    assert_eq!(status(&f, "windows"), Status::Bloqueante);
    let tpm = evaluate(&f).1.into_iter().find(|c| c.id == "tpm").unwrap();
    assert_eq!(tpm.estado, Status::Bloqueante);
    assert!(tpm.recomendacion.unwrap().contains("vTPM"));
    assert_eq!(evaluate(&f).0, Verdict::NoApto);
}
