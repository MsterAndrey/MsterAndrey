//! Vectores de Project Wycheproof: verifican las primitivas de las que dependemos
//! (AES-256-GCM con nonce de 96 bits y AES-256-KWP), incluidos los casos que deben fallar.

use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Nonce};
use aes_kw::KekAes256;
use nexus_envelope::{KekId, KeyWrapper, SoftwareKek};
use serde::Deserialize;

#[derive(Deserialize)]
struct File<T> {
    #[serde(rename = "testGroups")]
    groups: Vec<T>,
}

#[derive(Deserialize)]
struct GcmGroup {
    #[serde(rename = "keySize")]
    key_size: u32,
    #[serde(rename = "ivSize")]
    iv_size: u32,
    #[serde(rename = "tagSize")]
    tag_size: u32,
    tests: Vec<GcmCase>,
}

#[derive(Deserialize)]
struct GcmCase {
    #[serde(rename = "tcId")]
    id: u32,
    key: String,
    iv: String,
    aad: String,
    msg: String,
    ct: String,
    tag: String,
    result: String,
}

#[derive(Deserialize)]
struct KwpGroup {
    #[serde(rename = "keySize")]
    key_size: u32,
    tests: Vec<KwpCase>,
}

#[derive(Deserialize)]
struct KwpCase {
    #[serde(rename = "tcId")]
    id: u32,
    key: String,
    msg: String,
    ct: String,
    result: String,
}

fn h(s: &str) -> Vec<u8> {
    hex::decode(s).expect("hex válido")
}

#[test]
fn aes_256_gcm_wycheproof() {
    let file: File<GcmGroup> =
        serde_json::from_str(include_str!("vectors/aes_gcm_test.json")).expect("JSON válido");
    let (mut valid, mut invalid) = (0, 0);
    for g in file
        .groups
        .iter()
        .filter(|g| g.key_size == 256 && g.iv_size == 96 && g.tag_size == 128)
    {
        for t in &g.tests {
            let cipher = Aes256Gcm::new_from_slice(&h(&t.key)).unwrap();
            let iv = h(&t.iv);
            let aad = h(&t.aad);
            let mut ct = h(&t.ct);
            ct.extend_from_slice(&h(&t.tag));
            let dec = cipher.decrypt(
                Nonce::from_slice(&iv),
                Payload {
                    msg: &ct,
                    aad: &aad,
                },
            );
            match t.result.as_str() {
                "valid" => {
                    assert_eq!(
                        dec.as_deref().ok(),
                        Some(h(&t.msg).as_slice()),
                        "tcId {} descifrado",
                        t.id
                    );
                    let enc = cipher
                        .encrypt(
                            Nonce::from_slice(&iv),
                            Payload {
                                msg: &h(&t.msg),
                                aad: &aad,
                            },
                        )
                        .unwrap();
                    assert_eq!(enc, ct, "tcId {} cifrado", t.id);
                    valid += 1;
                }
                "invalid" => {
                    assert!(dec.is_err(), "tcId {} debía fallar", t.id);
                    invalid += 1;
                }
                _ => {}
            }
        }
    }
    assert!(valid > 0 && invalid > 0, "no se ejecutaron vectores");
    println!("AES-256-GCM: {valid} válidos, {invalid} inválidos");
}

#[test]
fn aes_256_kwp_wycheproof() {
    let file: File<KwpGroup> =
        serde_json::from_str(include_str!("vectors/aes_kwp_test.json")).expect("JSON válido");
    let (mut valid, mut invalid, mut via_kek, mut skipped_raw) = (0, 0, 0, 0);
    for g in file.groups.iter().filter(|g| g.key_size == 256) {
        for t in &g.tests {
            let key: [u8; 32] = h(&t.key).try_into().unwrap();
            let kw = KekAes256::from(key);
            let ct = h(&t.ct);
            // aes-kw 0.2.1 entra en pánico (desbordamiento en `n - 1`) con entradas de 8 bytes.
            // Hallazgo documentado en docs/resultados; nuestra SoftwareKek valida la longitud antes.
            if ct.len() < 16 {
                skipped_raw += 1;
                let kek = SoftwareKek::from_bytes(KekId::new("wycheproof").unwrap(), key);
                assert!(
                    kek.unwrap(&ct).is_err(),
                    "tcId {} SoftwareKek debía fallar",
                    t.id
                );
                invalid += 1;
                continue;
            }
            let unwrapped = kw.unwrap_with_padding_vec(&ct);
            match t.result.as_str() {
                "valid" => {
                    assert_eq!(
                        unwrapped.as_deref().ok(),
                        Some(h(&t.msg).as_slice()),
                        "tcId {}",
                        t.id
                    );
                    assert_eq!(
                        kw.wrap_with_padding_vec(&h(&t.msg)).unwrap(),
                        ct,
                        "tcId {} wrap",
                        t.id
                    );
                    valid += 1;
                    // Mismo vector a través de nuestra SoftwareKek cuando el mensaje es una DEK de 32 bytes.
                    if t.msg.len() == 64 {
                        let kek = SoftwareKek::from_bytes(KekId::new("wycheproof").unwrap(), key);
                        let dek = kek.unwrap(&ct).expect("SoftwareKek debe desenvolver");
                        assert_eq!(dek.expose().as_slice(), h(&t.msg).as_slice());
                        via_kek += 1;
                    }
                }
                "invalid" => {
                    assert!(unwrapped.is_err(), "tcId {} debía fallar", t.id);
                    let kek = SoftwareKek::from_bytes(KekId::new("wycheproof").unwrap(), key);
                    assert!(
                        kek.unwrap(&ct).is_err(),
                        "tcId {} SoftwareKek debía fallar",
                        t.id
                    );
                    invalid += 1;
                }
                _ => {}
            }
        }
    }
    assert!(valid > 0 && invalid > 0);
    println!(
        "AES-256-KWP: {valid} válidos ({via_kek} vía SoftwareKek), {invalid} inválidos ({skipped_raw} sólo vía SoftwareKek)"
    );
}
