use nexus_tpm::TpmKeyStore;

/// Fuera de Windows el almacén con TPM se niega a abrirse (no hay degradación silenciosa a claves en archivo).
#[test]
#[cfg(not(windows))]
fn fuera_de_windows_no_hay_degradacion() {
    let dir = std::env::temp_dir().join(format!("nexus-tpm-{}", std::process::id()));
    assert!(TpmKeyStore::open(&dir).is_err());
    let _ = std::fs::remove_dir_all(dir);
}

/// PRUEBA DE HARDWARE: requiere Windows con TPM 2.0 activo. Las máquinas de GitHub Actions no tienen TPM.
/// Ejecutar en un equipo real con: `cargo test -p nexus-tpm -- --ignored`
#[test]
#[ignore = "requiere Windows con TPM 2.0 (ejecutar manualmente con --ignored)"]
fn almacen_con_tpm_de_extremo_a_extremo() {
    use nexus_vault_local::{CompartmentKind, Vault};
    let base = std::env::temp_dir().join(format!("nexus-tpm-e2e-{}", std::process::id()));
    let keys = TpmKeyStore::open(base.join("keys")).expect("TPM 2.0 disponible");
    let v = Vault::create(base.join("vault"), keys, "prueba").unwrap();
    let c = v
        .create_compartment("Prueba TPM", CompartmentKind::Caso)
        .unwrap();
    v.put(&c, "a.txt", b"protegido por el TPM").unwrap();
    assert_eq!(
        v.read(&c, "a.txt", None).unwrap().as_slice(),
        b"protegido por el TPM"
    );
    // La KEK guardada en disco está cifrada por el TPM: no contiene 32 bytes en claro, mide lo que un bloque RSA-2048.
    let kek_file = std::fs::read_dir(base.join("keys"))
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path();
    assert_eq!(std::fs::read(kek_file).unwrap().len(), 256);
    let _ = std::fs::remove_dir_all(base);
}
