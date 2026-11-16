use nexus_diagnostico::facts::Facts;
use nexus_diagnostico::html::{escape, render};
use nexus_diagnostico::report::Report;

fn fixture(name: &str) -> Facts {
    let p = format!("{}/tests/fixtures/{name}.json", env!("CARGO_MANIFEST_DIR"));
    Facts::from_json(&std::fs::read_to_string(p).unwrap()).unwrap()
}

#[test]
fn escapa_caracteres_html() {
    assert_eq!(
        escape(r#"<a href="x">'&'</a>"#),
        "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
    );
}

/// Un nombre de equipo malicioso no puede inyectar código en el informe.
#[test]
fn datos_del_equipo_no_inyectan_html() {
    let mut f = fixture("win11_ok");
    f.hostname = Some("<script>alert(1)</script>".into());
    f.model = Some("<img src=x onerror=alert(1)>".into());
    let html = render(&Report::new(&f, false));
    assert!(!html.contains("<script"));
    assert!(!html.contains("<img"));
    assert!(html.contains("&lt;script&gt;alert(1)&lt;/script&gt;"));
}

/// El informe es autocontenido: sin scripts, sin recursos externos y con una CSP que lo impide.
#[test]
fn informe_autocontenido_y_sin_recursos_externos() {
    let html = render(&Report::new(&fixture("win10_tpm_disabled"), false));
    assert!(html.contains("default-src 'none'"));
    for bad in ["<script", " src=", "href=", "@import", "https://"] {
        assert!(!html.contains(bad), "contiene «{bad}»");
    }
    // `url(` sólo para referencias internas del SVG (`url(#…)`), nunca a recursos externos.
    assert_eq!(html.matches("url(").count(), html.matches("url(#").count());
    // El único http:// permitido es el espacio de nombres del SVG incrustado.
    assert_eq!(
        html.matches("http://").count(),
        html.matches("http://www.w3.org/2000/svg").count()
    );
}

#[test]
fn veredicto_y_comprobaciones_en_el_informe() {
    let html = render(&Report::new(&fixture("win10_tpm_off"), false));
    assert!(html.contains("NO APTO"));
    assert!(html.contains("class=\"chip bloqueante\""));
    assert!(html.contains("Qué hacer:"));
    let ok = render(&Report::new(&fixture("win11_ok"), true));
    assert!(ok.contains("class=\"verdict ok\"") && ok.contains("equipo-anonimo"));
    assert!(!ok.contains("ABOG-PC-014"));
}

#[test]
fn el_fabricante_no_se_repite_en_el_modelo() {
    let r = Report::new(&fixture("win10_tpm_off"), false);
    assert_eq!(r.modelo.as_deref(), Some("HP ProDesk 400 G5"));
    let r = Report::new(&fixture("win11_ok"), false);
    assert_eq!(r.modelo.as_deref(), Some("Dell Inc. Latitude 5440"));
}
