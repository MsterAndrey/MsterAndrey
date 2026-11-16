//! En Windows (MSVC), incrusta un manifiesto que pide permisos de administrador al abrir el programa:
//! sin ellos no se pueden leer el TPM, Secure Boot ni BitLocker.
fn main() {
    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc") {
        println!("cargo:rustc-link-arg-bin=nexus-diagnostico=/MANIFEST:EMBED");
        println!(
            "cargo:rustc-link-arg-bin=nexus-diagnostico=/MANIFESTUAC:level='requireAdministrator'"
        );
    }
    println!("cargo:rerun-if-changed=build.rs");
}
