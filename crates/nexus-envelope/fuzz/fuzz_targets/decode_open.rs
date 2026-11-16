//! Entrada no confiable: bytes arbitrarios como objeto NCOBJ.
//! Objetivo: ningún pánico y ningún descifrado exitoso de datos que no se sellaron con esta KEK.
#![no_main]

use libfuzzer_sys::fuzz_target;
use nexus_envelope::{open, read_header, KekId, SoftwareKek};

fuzz_target!(|data: &[u8]| {
    let kek = SoftwareKek::from_bytes(KekId::new("fuzz/v1").unwrap(), [9u8; 32]);
    if let Ok(header) = read_header(data) {
        // Usar el contexto de la propia cabecera para llegar a desenvolver y descifrar.
        let ctx = *header.context();
        // El fuzzer no puede forjar un objeto válido sin conocer la KEK (salvo que la encuentre
        // en sus propias entradas, lo que sería un hallazgo).
        assert!(open(&kek, &ctx, data).is_err());
    }
});
