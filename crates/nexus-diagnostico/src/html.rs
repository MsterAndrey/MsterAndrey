//! Informe visual autocontenido (un único archivo HTML, sin scripts ni recursos externos).
//!
//! Todo texto que proviene del equipo (nombre, modelo, sistema…) se escapa antes de insertarse.

use crate::evaluate::{Status, Verdict};
use crate::report::Report;

/// Isotipo oficial (generado por `web/scripts/build-brand.mjs`).
const ISOTIPO: &str = include_str!("../../../web/public/brand/nexus-cube-isotipo.svg");

/// Escapa texto para insertarlo en HTML (contenido y atributos).
#[must_use]
pub fn escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

fn verdict_class(v: Verdict) -> &'static str {
    match v {
        Verdict::Apto => "ok",
        Verdict::AptoConAcciones => "accion",
        Verdict::NoApto => "bloqueante",
        Verdict::Incompleto => "desconocido",
    }
}

fn verdict_summary(v: Verdict) -> &'static str {
    match v {
        Verdict::Apto => "Este equipo cumple los requisitos para instalar NEXUS CUBE.",
        Verdict::AptoConAcciones => {
            "Este equipo podrá usar NEXUS CUBE después de completar las acciones indicadas."
        }
        Verdict::NoApto => {
            "Este equipo no puede usar NEXUS CUBE. Revise los puntos marcados como bloqueantes."
        }
        Verdict::Incompleto => "Faltan datos. Vuelva a ejecutar la herramienta como administrador.",
    }
}

fn status_label(s: Status) -> (&'static str, &'static str) {
    match s {
        Status::Ok => ("ok", "Correcto"),
        Status::Accion => ("accion", "Requiere acción"),
        Status::Bloqueante => ("bloqueante", "Bloqueante"),
        Status::Desconocido => ("desconocido", "Sin datos"),
    }
}

const STYLE: &str = r#"
:root{--bg:#080d1a;--surface:#0f172a;--line:rgba(148,163,184,.16);--text:#f1f5f9;--muted:#a3b1c6;--faint:#64748b;
--blue:#2563eb;--electric:#38bdf8;--ok:#22c55e;--ok-bg:rgba(34,197,94,.12);--accion:#f59e0b;--accion-bg:rgba(245,158,11,.12);
--bloq:#ef4444;--bloq-bg:rgba(239,68,68,.12);--unk:#94a3b8;--unk-bg:rgba(148,163,184,.12);color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 "Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,Roboto,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:860px;margin:0 auto;padding:40px 24px 56px;display:grid;gap:28px}
header{display:flex;align-items:center;gap:16px}
header svg{width:44px;height:44px;flex-shrink:0}
.brand{font-weight:700;letter-spacing:.14em;font-size:15px}
.brand span{color:var(--blue)}
.sub{font-size:13px;color:var(--muted)}
.verdict{border-radius:16px;padding:28px;border:1px solid var(--line);display:grid;gap:8px;background:var(--surface);position:relative;overflow:hidden}
.verdict::before{content:"";position:absolute;inset:0 auto 0 0;width:6px;background:var(--c)}
.verdict.ok{--c:var(--ok)}.verdict.accion{--c:var(--accion)}.verdict.bloqueante{--c:var(--bloq)}.verdict.desconocido{--c:var(--unk)}
.verdict .label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.verdict .value{font-size:clamp(28px,6vw,40px);font-weight:700;letter-spacing:-.01em;color:var(--c);line-height:1.1}
.verdict p{margin:0;color:var(--text)}
dl.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px 24px;margin:0}
dl.meta div{display:grid;gap:2px;align-content:start}
dl.meta dt{font-size:12px;color:var(--faint);text-transform:uppercase;letter-spacing:.08em}
dl.meta dd{margin:0;font-variant-numeric:tabular-nums}
h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 4px;font-weight:600}
ol{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--surface)}
li{display:grid;grid-template-columns:1fr auto;gap:6px 16px;padding:18px 20px;border-top:1px solid var(--line)}
li:first-child{border-top:0}
li h3{margin:0;font-size:16px;font-weight:600}
li .detail{grid-column:1/-1;margin:0;color:var(--muted)}
li .rec{grid-column:1/-1;margin:4px 0 0;padding:10px 14px;border-radius:10px;background:rgba(37,99,235,.10);border:1px solid rgba(56,189,248,.22);font-size:14px}
li .rec b{color:var(--electric);font-weight:600}
.chip{align-self:start;font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;white-space:nowrap;color:var(--c);background:var(--cb)}
.chip.ok{--c:var(--ok);--cb:var(--ok-bg)}.chip.accion{--c:var(--accion);--cb:var(--accion-bg)}
.chip.bloqueante{--c:var(--bloq);--cb:var(--bloq-bg)}.chip.desconocido{--c:var(--unk);--cb:var(--unk-bg)}
footer{font-size:13px;color:var(--faint);display:grid;gap:4px;border-top:1px solid var(--line);padding-top:20px}
@media (max-width:560px){main{padding:24px 16px 40px}li{grid-template-columns:1fr}.chip{justify-self:start}}
@media print{:root{--bg:#fff;--surface:#fff;--text:#0f172a;--muted:#334155;--faint:#64748b;--line:#cbd5e1;color-scheme:light}
body{font-size:12px}main{padding:0}.verdict,ol{break-inside:avoid}li{break-inside:avoid}}
"#;

/// Genera el informe visual completo.
#[must_use]
pub fn render(r: &Report) -> String {
    let vclass = verdict_class(r.veredicto);
    let mut meta = String::new();
    let mut push_meta = |k: &str, v: Option<&str>| {
        if let Some(v) = v {
            meta.push_str(&format!(
                "<div><dt>{}</dt><dd>{}</dd></div>",
                escape(k),
                escape(v)
            ));
        }
    };
    push_meta("Equipo", Some(&r.equipo));
    push_meta("Sistema", r.sistema.as_deref());
    push_meta("Modelo", r.modelo.as_deref());
    let fecha = r.fecha.as_deref().map(|f| f.replacen('T', " · ", 1));
    push_meta("Fecha del análisis", fecha.as_deref());

    let mut checks = String::new();
    for c in &r.comprobaciones {
        let (cls, label) = status_label(c.estado);
        checks.push_str(&format!(
            "<li><h3>{}</h3><span class=\"chip {cls}\">{label}</span><p class=\"detail\">{}</p>",
            escape(c.titulo),
            escape(&c.detalle)
        ));
        if let Some(rec) = &c.recomendacion {
            checks.push_str(&format!(
                "<p class=\"rec\"><b>Qué hacer:</b> {}</p>",
                escape(rec)
            ));
        }
        checks.push_str("</li>");
    }

    format!(
        r#"<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<meta name="referrer" content="no-referrer">
<title>Diagnóstico NEXUS CUBE · {equipo}</title>
<style>{STYLE}</style>
</head>
<body>
<main>
<header>{ISOTIPO}<div><div class="brand">NEXUS <span>CUBE</span></div><div class="sub">Diagnóstico de equipo · versión {version}</div></div></header>
<section class="verdict {vclass}" aria-label="Veredicto">
<div class="label">Veredicto</div>
<div class="value">{verdict}</div>
<p>{summary}</p>
</section>
<dl class="meta">{meta}</dl>
<section>
<h2>Comprobaciones</h2>
<ol>{checks}</ol>
</section>
<footer>
<span>Sólo lectura: la herramienta no cambió ninguna configuración de este equipo.</span>
<span>Sin conexión: este informe se generó y se guardó sólo en este equipo. Usted decide si lo comparte.</span>
</footer>
</main>
</body>
</html>
"#,
        equipo = escape(&r.equipo),
        version = escape(r.version),
        verdict = r.veredicto.label(),
        summary = verdict_summary(r.veredicto),
    )
}
