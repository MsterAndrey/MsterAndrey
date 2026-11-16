//! Ida y vuelta con contenido y contexto arbitrarios; una alteración de un bit debe detectarse.
#![no_main]

use libfuzzer_sys::fuzz_target;
use nexus_envelope::{open, seal, KekId, ObjectContext, SoftwareKek};

fuzz_target!(|input: (([u8; 16], [u8; 16], u64), u16, Vec<u8>)| {
    let ((tenant, object, version), flip, msg) = input;
    let kek = SoftwareKek::from_bytes(KekId::new("fuzz/v1").unwrap(), [9u8; 32]);
    let ctx = ObjectContext { tenant_id: tenant, compartment_id: [1; 16], object_id: object, object_version: version };
    let sealed = seal(&kek, &ctx, &msg).unwrap();
    assert_eq!(open(&kek, &ctx, &sealed).unwrap().as_slice(), msg.as_slice());
    let mut t = sealed;
    let i = usize::from(flip) % t.len();
    t[i] ^= 0x80;
    assert!(open(&kek, &ctx, &t).is_err());
});
