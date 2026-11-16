//! Pruebas basadas en propiedades (entradas aleatorias generadas por proptest).

use nexus_envelope::{KekId, ObjectContext, SoftwareKek, open, read_header, seal};
use proptest::prelude::*;

fn arb_ctx() -> impl Strategy<Value = ObjectContext> {
    (
        any::<[u8; 16]>(),
        any::<[u8; 16]>(),
        any::<[u8; 16]>(),
        any::<u64>(),
    )
        .prop_map(|(t, c, o, v)| ObjectContext {
            tenant_id: t,
            compartment_id: c,
            object_id: o,
            object_version: v,
        })
}

fn fixed_kek() -> SoftwareKek {
    SoftwareKek::from_bytes(KekId::new("prop/v1").unwrap(), [7u8; 32])
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(512))]

    /// Todo lo que se sella se abre igual con el mismo contexto.
    #[test]
    fn ida_y_vuelta(ctx in arb_ctx(), msg in proptest::collection::vec(any::<u8>(), 0..4096)) {
        let k = fixed_kek();
        let sealed = seal(&k, &ctx, &msg).unwrap();
        let opened = open(&k, &ctx, &sealed).unwrap();
        prop_assert_eq!(opened.as_slice(), msg.as_slice());
    }

    /// Ningún bit alterado, en ninguna posición, produce un descifrado exitoso.
    #[test]
    fn ningun_bit_alterado_pasa(ctx in arb_ctx(), msg in proptest::collection::vec(any::<u8>(), 0..256), pos in any::<prop::sample::Index>(), bit in 0u8..8) {
        let k = fixed_kek();
        let mut sealed = seal(&k, &ctx, &msg).unwrap();
        let i = pos.index(sealed.len());
        sealed[i] ^= 1 << bit;
        prop_assert!(open(&k, &ctx, &sealed).is_err(), "bit {} del byte {} aceptado", bit, i);
    }

    /// El parser y `open` nunca entran en pánico con bytes arbitrarios.
    #[test]
    fn bytes_arbitrarios_no_provocan_panico(data in proptest::collection::vec(any::<u8>(), 0..512), ctx in arb_ctx()) {
        let _ = read_header(&data);
        let _ = open(&fixed_kek(), &ctx, &data);
    }

    /// Lo mismo con entradas que empiezan con una cabecera casi válida (más profundidad en el parser).
    #[test]
    fn cabeceras_casi_validas_no_provocan_panico(tail in proptest::collection::vec(any::<u8>(), 0..300), ctx in arb_ctx()) {
        let mut data = b"NCOB\x01\x00\x01".to_vec();
        data.extend_from_slice(&tail);
        let _ = read_header(&data);
        let _ = open(&fixed_kek(), &ctx, &data);
    }
}
