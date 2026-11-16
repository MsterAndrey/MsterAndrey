//! Propiedades de seguridad de NCOBJ v1 (ver docs/02 §2.4 y docs/15 §15.3).

use nexus_envelope::{
    Error, KekId, KeyWrapper, ObjectContext, SoftwareKek, open, read_header, rewrap, seal,
};

const ORG_A: [u8; 16] = [0xA1; 16];
const ORG_B: [u8; 16] = [0xB2; 16];

// Desplazamientos dentro de la cabecera (ver src/format.rs).
const OFF_VERSION: usize = 4;
const OFF_SUITE: usize = 5;
const OFF_TENANT: usize = 7;
const OFF_OBJ_VERSION: usize = 55;
const OFF_NONCE: usize = 64;

fn ctx(tenant: [u8; 16], version: u64) -> ObjectContext {
    ObjectContext {
        tenant_id: tenant,
        compartment_id: [0x0C; 16],
        object_id: [0x0B; 16],
        object_version: version,
    }
}

fn kek(id: &str) -> SoftwareKek {
    SoftwareKek::generate(KekId::new(id).unwrap()).unwrap()
}

/// Longitud de la cabecera para poder localizar el texto cifrado.
fn header_len(sealed: &[u8]) -> usize {
    let kid_len = sealed[OFF_NONCE + 12] as usize;
    let w_off = OFF_NONCE + 12 + 1 + kid_len;
    let wlen = u16::from_be_bytes([sealed[w_off], sealed[w_off + 1]]) as usize;
    w_off + 2 + wlen
}

#[test]
fn ida_y_vuelta() {
    let k = kek("comp-1/v1");
    let c = ctx(ORG_A, 1);
    let msg = b"Expediente 2026-114: contrato de arrendamiento".to_vec();
    let sealed = seal(&k, &c, &msg).unwrap();
    assert_eq!(open(&k, &c, &sealed).unwrap().as_slice(), msg.as_slice());
    assert!(
        !sealed.windows(msg.len()).any(|w| w == msg.as_slice()),
        "el texto plano no debe aparecer"
    );
}

#[test]
fn objeto_vacio() {
    let k = kek("comp-1/v1");
    let c = ctx(ORG_A, 1);
    let sealed = seal(&k, &c, b"").unwrap();
    assert!(open(&k, &c, &sealed).unwrap().is_empty());
}

#[test]
fn cada_sellado_usa_dek_y_nonce_nuevos() {
    let k = kek("comp-1/v1");
    let c = ctx(ORG_A, 1);
    let a = seal(&k, &c, b"mismo contenido").unwrap();
    let b = seal(&k, &c, b"mismo contenido").unwrap();
    assert_ne!(a, b);
    let (ha, hb) = (header_len(&a), header_len(&b));
    assert_ne!(
        a[OFF_NONCE..OFF_NONCE + 12],
        b[OFF_NONCE..OFF_NONCE + 12],
        "nonce"
    );
    assert_ne!(a[ha - 40..ha], b[hb - 40..hb], "DEK envuelta");
}

#[test]
fn contexto_distinto_se_rechaza() {
    let k = kek("comp-1/v1");
    let sealed = seal(&k, &ctx(ORG_A, 1), b"datos de A").unwrap();
    assert_eq!(
        open(&k, &ctx(ORG_B, 1), &sealed).unwrap_err(),
        Error::ContextMismatch
    );
    assert_eq!(
        open(&k, &ctx(ORG_A, 2), &sealed).unwrap_err(),
        Error::ContextMismatch
    );
}

/// Aunque un atacante reescriba la cabecera para que coincida con otra organización
/// (y así supere la comprobación explícita), el AAD impide descifrar.
#[test]
fn mover_objeto_a_otra_organizacion_falla_criptograficamente() {
    let k = kek("comp-1/v1");
    let mut sealed = seal(&k, &ctx(ORG_A, 1), b"datos de A").unwrap();
    sealed[OFF_TENANT..OFF_TENANT + 16].copy_from_slice(&ORG_B);
    assert_eq!(
        open(&k, &ctx(ORG_B, 1), &sealed).unwrap_err(),
        Error::Decryption
    );
}

#[test]
fn rollback_de_version_falla_criptograficamente() {
    let k = kek("comp-1/v1");
    let mut sealed = seal(&k, &ctx(ORG_A, 1), b"version 1").unwrap();
    sealed[OFF_OBJ_VERSION..OFF_OBJ_VERSION + 8].copy_from_slice(&7u64.to_be_bytes());
    assert_eq!(
        open(&k, &ctx(ORG_A, 7), &sealed).unwrap_err(),
        Error::Decryption
    );
}

#[test]
fn kek_equivocada() {
    let k1 = kek("comp-1/v1");
    let sealed = seal(&k1, &ctx(ORG_A, 1), b"x").unwrap();
    // Otra KEK con otro identificador.
    assert_eq!(
        open(&kek("comp-2/v1"), &ctx(ORG_A, 1), &sealed).unwrap_err(),
        Error::KekMismatch
    );
    // Misma etiqueta pero otra clave (p. ej. una KEK falsificada con el mismo nombre).
    assert_eq!(
        open(&kek("comp-1/v1"), &ctx(ORG_A, 1), &sealed).unwrap_err(),
        Error::Unwrap
    );
}

#[test]
fn cualquier_byte_alterado_del_cifrado_o_nonce_se_detecta() {
    let k = kek("comp-1/v1");
    let c = ctx(ORG_A, 1);
    let sealed = seal(&k, &c, b"historia clinica ficticia").unwrap();
    let hl = header_len(&sealed);
    let positions = (OFF_NONCE..OFF_NONCE + 12).chain(hl..sealed.len());
    for i in positions {
        let mut t = sealed.clone();
        t[i] ^= 0x01;
        assert_eq!(open(&k, &c, &t).unwrap_err(), Error::Decryption, "byte {i}");
    }
}

#[test]
fn intercambiar_dek_envuelta_entre_objetos_falla() {
    let k = kek("comp-1/v1");
    let c = ctx(ORG_A, 1);
    let a = seal(&k, &c, b"objeto A").unwrap();
    let b = seal(&k, &c, b"objeto B").unwrap();
    let (ha, hb) = (header_len(&a), header_len(&b));
    let mut mixed = a.clone();
    mixed[ha - 40..ha].copy_from_slice(&b[hb - 40..hb]);
    assert_eq!(open(&k, &c, &mixed).unwrap_err(), Error::Decryption);
}

#[test]
fn suite_y_version_desconocidas_se_rechazan() {
    let k = kek("comp-1/v1");
    let c = ctx(ORG_A, 1);
    let sealed = seal(&k, &c, b"x").unwrap();

    let mut s = sealed.clone();
    s[OFF_SUITE..OFF_SUITE + 2].copy_from_slice(&0x0002u16.to_be_bytes());
    assert_eq!(open(&k, &c, &s).unwrap_err(), Error::UnsupportedSuite(2));

    let mut v = sealed.clone();
    v[OFF_VERSION] = 2;
    assert_eq!(
        open(&k, &c, &v).unwrap_err(),
        Error::UnsupportedFormatVersion(2)
    );

    let mut m = sealed.clone();
    m[0] = b'X';
    assert_eq!(open(&k, &c, &m).unwrap_err(), Error::Malformed("magic"));
}

#[test]
fn truncado_en_cualquier_punto_falla_sin_panico() {
    let k = kek("comp-1/v1");
    let c = ctx(ORG_A, 1);
    let sealed = seal(&k, &c, b"contenido de prueba").unwrap();
    for n in 0..sealed.len() {
        assert!(open(&k, &c, &sealed[..n]).is_err(), "longitud {n}");
    }
}

#[test]
fn rotacion_de_kek_sin_recifrar() {
    let old = kek("comp-1/v1");
    let new = kek("comp-1/v2");
    let c = ctx(ORG_A, 3);
    let sealed = seal(&old, &c, b"datos").unwrap();
    let rotated = rewrap(&old, &new, &sealed).unwrap();

    assert_eq!(open(&new, &c, &rotated).unwrap().as_slice(), b"datos");
    assert_eq!(open(&old, &c, &rotated).unwrap_err(), Error::KekMismatch);
    assert_eq!(read_header(&rotated).unwrap().kek_id(), new.kek_id());
    // El texto cifrado (y el nonce) no cambian: no hubo re-cifrado.
    let (hs, hr) = (header_len(&sealed), header_len(&rotated));
    assert_eq!(sealed[hs..], rotated[hr..]);
    assert_eq!(sealed[..OFF_NONCE + 12], rotated[..OFF_NONCE + 12]);
    // Rotar con una KEK de origen equivocada no es posible.
    assert_eq!(rewrap(&new, &old, &sealed).unwrap_err(), Error::KekMismatch);
}

#[test]
fn las_claves_no_aparecen_en_debug() {
    let key = [0x42u8; 32];
    let k = SoftwareKek::from_bytes(KekId::new("debug").unwrap(), key);
    let s = format!("{k:?}");
    assert!(s.contains("oculta"));
    assert!(!s.contains("42, 42") && !s.to_lowercase().contains("4242"));
}

#[test]
fn identificadores_de_kek_validos() {
    assert_eq!(KekId::new("").unwrap_err(), Error::InvalidKekId);
    assert_eq!(KekId::new([b'a'; 65]).unwrap_err(), Error::InvalidKekId);
    assert!(KekId::new([b'a'; 64]).is_ok());
}

/// Regresión: aes-kw 0.2.1 entra en pánico al desenvolver entradas de 8 bytes.
/// SoftwareKek debe rechazar cualquier longitud distinta de 40 sin llegar a llamar a la librería.
#[test]
fn dek_envuelta_de_longitud_invalida_no_provoca_panico() {
    let k = kek("comp-1/v1");
    for n in [0usize, 1, 8, 16, 24, 32, 39, 41, 48, 512] {
        assert_eq!(
            k.unwrap(&vec![0u8; n]).unwrap_err(),
            Error::Unwrap,
            "longitud {n}"
        );
    }
}
