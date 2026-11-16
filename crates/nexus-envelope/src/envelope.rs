//! Operaciones de alto nivel: sellar, abrir y re-envolver objetos.

use aes_gcm::aead::{Aead, KeyInit, OsRng, Payload, rand_core::RngCore};
use aes_gcm::{Aes256Gcm, Nonce};
use zeroize::Zeroizing;

use crate::error::Error;
use crate::format::{Header, ObjectContext, SuiteId};
use crate::kek::{Dek, KeyWrapper};

/// Tamaño máximo de texto plano en este prototipo (en memoria, sin streaming): 256 MiB.
pub const MAX_PLAINTEXT_LEN: usize = 256 * 1024 * 1024;

/// Cifra `plaintext` para el contexto `ctx`, con una DEK nueva envuelta por `kek`.
///
/// Devuelve el objeto NCOBJ v1 completo (cabecera ‖ ciphertext ‖ tag).
///
/// # Errors
/// [`Error::TooLarge`], [`Error::Rng`] o [`Error::Unwrap`] (fallo de la KEK).
pub fn seal(kek: &dyn KeyWrapper, ctx: &ObjectContext, plaintext: &[u8]) -> Result<Vec<u8>, Error> {
    if plaintext.len() > MAX_PLAINTEXT_LEN {
        return Err(Error::TooLarge);
    }
    let suite = SuiteId::NcAead1;
    let dek = Dek::generate()?;
    // Cada DEK cifra exactamente un mensaje, así que el nonce nunca se repite bajo la misma clave.
    let mut nonce = vec![0u8; suite.nonce_len()];
    OsRng.try_fill_bytes(&mut nonce).map_err(|_| Error::Rng)?;

    let header = Header {
        suite,
        context: *ctx,
        nonce,
        kek_id: kek.kek_id().clone(),
        wrapped_dek: kek.wrap(&dek)?,
    };
    let aad = header.aad();
    let cipher = Aes256Gcm::new_from_slice(dek.expose()).map_err(|_| Error::Decryption)?;
    let ct = cipher
        .encrypt(
            Nonce::from_slice(&header.nonce),
            Payload {
                msg: plaintext,
                aad: &aad,
            },
        )
        .map_err(|_| Error::Decryption)?;

    let mut out = header.encode()?;
    out.extend_from_slice(&ct);
    Ok(out)
}

/// Lee la cabecera sin descifrar (p. ej. para elegir la KEK por su identificador).
///
/// # Errors
/// [`Error::Malformed`], [`Error::UnsupportedFormatVersion`] o [`Error::UnsupportedSuite`].
pub fn read_header(sealed: &[u8]) -> Result<Header, Error> {
    Header::decode(sealed).map(|(h, _)| h)
}

/// Descifra un objeto y verifica que corresponde a `expected`.
///
/// Falla si el objeto pertenece a otra organización, compartimento, objeto o versión,
/// si fue manipulado, o si `kek` no es la KEK con la que se envolvió.
/// El texto plano devuelto se borra de memoria al liberarse.
///
/// # Errors
/// Errores de formato, [`Error::ContextMismatch`], [`Error::KekMismatch`], [`Error::Unwrap`]
/// o [`Error::Decryption`].
pub fn open(
    kek: &dyn KeyWrapper,
    expected: &ObjectContext,
    sealed: &[u8],
) -> Result<Zeroizing<Vec<u8>>, Error> {
    let (header, ct) = Header::decode(sealed)?;
    // Comprobación explícita (falla rápido y con un error claro). El AAD lo vuelve a garantizar
    // criptográficamente aunque alguien omitiera esta comprobación.
    if header.context != *expected {
        return Err(Error::ContextMismatch);
    }
    if header.kek_id != *kek.kek_id() {
        return Err(Error::KekMismatch);
    }
    let dek = kek.unwrap(&header.wrapped_dek)?;
    let cipher = Aes256Gcm::new_from_slice(dek.expose()).map_err(|_| Error::Decryption)?;
    let aad = header.aad();
    cipher
        .decrypt(
            Nonce::from_slice(&header.nonce),
            Payload { msg: ct, aad: &aad },
        )
        .map(Zeroizing::new)
        .map_err(|_| Error::Decryption)
}

/// Rota la KEK de un objeto: desenvuelve la DEK con `old` y la envuelve con `new`,
/// **sin tocar el texto cifrado**. El resultado sólo se abre con `new`.
///
/// No verifica la integridad de los datos (no descifra). Para verificarla, usar [`open`].
///
/// # Errors
/// Errores de formato, [`Error::KekMismatch`] o [`Error::Unwrap`].
pub fn rewrap(old: &dyn KeyWrapper, new: &dyn KeyWrapper, sealed: &[u8]) -> Result<Vec<u8>, Error> {
    let (mut header, ct) = Header::decode(sealed)?;
    if header.kek_id != *old.kek_id() {
        return Err(Error::KekMismatch);
    }
    let dek = old.unwrap(&header.wrapped_dek)?;
    header.wrapped_dek = new.wrap(&dek)?;
    header.kek_id = new.kek_id().clone();
    let mut out = header.encode()?;
    out.extend_from_slice(ct);
    Ok(out)
}
