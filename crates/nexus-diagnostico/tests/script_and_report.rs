use nexus_diagnostico::collect::{SCRIPT, encode_command};
use nexus_diagnostico::facts::Facts;
use nexus_diagnostico::report::{Report, StoredReport, consolidate};

#[test]
fn codificacion_para_powershell() {
    // Valores comprobados con [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes(...)).
    assert_eq!(encode_command("a"), "YQA=");
    assert_eq!(encode_command("dir"), "ZABpAHIA");
    assert_eq!(encode_command(""), "");
}

/// El script debe ser de sólo lectura y no usar la red.
#[test]
fn el_script_no_usa_red_ni_modifica_el_equipo() {
    let lower = SCRIPT.to_lowercase();
    let forbidden = [
        "invoke-webrequest",
        "invoke-restmethod",
        "net.webclient",
        "start-bitstransfer",
        "net.sockets",
        "system.net.http",
        "iwr ",
        "curl",
        "wget",
        "set-",
        "remove-",
        "enable-",
        "disable-",
        "clear-tpm",
        "initialize-tpm",
        "out-file",
        "add-content",
        "new-item",
        "restart-",
        "stop-",
        "start-process",
        "invoke-expression",
        "iex ",
        "reg add",
        "bcdedit",
        "manage-bde",
    ];
    for f in forbidden {
        assert!(!lower.contains(f), "el script contiene «{f}»");
    }
    // Única creación de objeto permitida: comprobar si es administrador.
    assert_eq!(lower.matches("new-object").count(), 1);
    assert!(lower.contains("new-object security.principal.windowsprincipal"));
}

#[test]
fn informe_anonimo_no_incluye_nombre_ni_modelo() {
    let f = Facts::from_json(
        r#"{"hostname":"ABOG-PC-014","manufacturer":"Dell Inc.","model":"Latitude"}"#,
    )
    .unwrap();
    let r = Report::new(&f, true);
    let json = r.to_json().unwrap();
    assert!(!json.contains("ABOG-PC-014") && !json.contains("Latitude"));
}

#[test]
fn informe_de_texto_muestra_veredicto_y_recomendaciones() {
    let f = Facts::from_json(r#"{"is_admin":true,"hostname":"PC1","os_build":19045,"tpm_present":false,"secure_boot":false,"bitlocker_on":false,"last_update_days":10}"#).unwrap();
    let t = Report::new(&f, false).to_text();
    assert!(t.contains("VEREDICTO:  NO APTO"));
    assert!(t.contains("[BLOQUEA] TPM 2.0"));
    assert!(t.contains("→ Si el procesador tiene fTPM"));
}

#[test]
fn consolidado_y_proteccion_contra_inyeccion_csv() {
    let mk = |e: &str, v: &str| -> StoredReport {
        serde_json::from_str(&format!(r#"{{"equipo":"{e}","veredicto":"{v}","comprobaciones":[{{"id":"tpm","estado":"ok"}}]}}"#)).unwrap()
    };
    let (csv, summary) = consolidate(&[
        mk("PC1", "apto"),
        mk("=HYPERLINK(1)", "no_apto"),
        mk("PC3", "apto"),
    ]);
    assert!(summary.contains("Equipos analizados: 3"));
    assert!(summary.contains("apto: 2"));
    assert!(
        csv.contains("'=HYPERLINK(1)"),
        "las fórmulas deben neutralizarse"
    );
    assert!(
        csv.lines()
            .next()
            .unwrap()
            .starts_with("equipo,veredicto,tpm")
    );
}
