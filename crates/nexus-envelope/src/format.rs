//! Codificación binaria canónica de la cabecera NCOBJ v1.
//!
//! ```text
//! offset  campo            tamaño
//! 0       magic "NCOB"     4
//! 4       format_version   1      (= 1)
//! 5       suite_id         2  BE
//! 7       tenant_id        16
//! 23      compartment_id   16
//! 39      object_id        16
//! 55      object_version   8  BE
//! 63      nonce_len        1      (= 12 para NC-AEAD-1)
//! 64      nonce            n
//! ..      kek_id_len       1      (1..=64)
//! ..      kek_id           k
//! ..      wrapped_dek_len  2  BE  (1..=512)
//! ..      wrapped_dek      w
//! ..      ciphertext||tag  resto
//! ```
//!
//! **AAD** = bytes `[0 .. 64+n)` (desde `magic` hasta `nonce` inclusive) ‖ `"NCOBJ-v1"`.
//! `kek_id` y `wrapped_dek` quedan **fuera** del AAD a propósito: así la KEK puede rotarse
//! re-envolviendo la DEK sin volver a cifrar los datos (ver `docs/02` §2.5). Sustituir
//! `wrapped_dek` por otro valor sólo produce una DEK distinta, y el descifrado falla.

use crate::error::Error;
use crate::kek::KekId;

/// Identificador mágico del formato.
pub const MAGIC: [u8; 4] = *b"NCOB";
/// Única versión de formato soportada.
pub const FORMAT_VERSION: u8 = 1;
/// Sufijo de separación de dominio del AAD.
pub(crate) const AAD_DOMAIN: &[u8] = b"NCOBJ-v1";

const FIXED_PREFIX: usize = 4 + 1 + 2 + 16 + 16 + 16 + 8; // 63
const MAX_WRAPPED_DEK: usize = 512;

/// Suites criptográficas (ver `docs/02` §2.2). Sólo `NC-AEAD-1` está implementada.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[non_exhaustive]
pub enum SuiteId {
    /// `NC-AEAD-1`: AES-256-GCM, nonce de 96 bits, DEK única por objeto/versión.
    NcAead1,
}

impl SuiteId {
    /// Código numérico en el formato.
    #[must_use]
    pub const fn code(self) -> u16 {
        match self {
            SuiteId::NcAead1 => 0x0001,
        }
    }

    /// Longitud de nonce de la suite.
    #[must_use]
    pub const fn nonce_len(self) -> usize {
        match self {
            SuiteId::NcAead1 => 12,
        }
    }

    /// Longitud del tag de autenticación.
    #[must_use]
    pub const fn tag_len(self) -> usize {
        match self {
            SuiteId::NcAead1 => 16,
        }
    }

    pub(crate) fn from_code(code: u16) -> Result<Self, Error> {
        match code {
            0x0001 => Ok(SuiteId::NcAead1),
            other => Err(Error::UnsupportedSuite(other)),
        }
    }
}

/// Contexto al que queda vinculado un objeto cifrado.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ObjectContext {
    /// Organización (tenant), p. ej. un UUID.
    pub tenant_id: [u8; 16],
    /// Compartimento dentro de la organización.
    pub compartment_id: [u8; 16],
    /// Objeto.
    pub object_id: [u8; 16],
    /// Versión del objeto (cada versión se cifra con una DEK distinta).
    pub object_version: u64,
}

/// Cabecera decodificada de un objeto NCOBJ. No contiene secretos.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Header {
    pub(crate) suite: SuiteId,
    pub(crate) context: ObjectContext,
    pub(crate) nonce: Vec<u8>,
    pub(crate) kek_id: KekId,
    pub(crate) wrapped_dek: Vec<u8>,
}

impl Header {
    /// Suite criptográfica.
    #[must_use]
    pub fn suite(&self) -> SuiteId {
        self.suite
    }
    /// Contexto al que está vinculado el objeto.
    #[must_use]
    pub fn context(&self) -> &ObjectContext {
        &self.context
    }
    /// KEK con la que está envuelta la DEK (para elegir la KEK correcta antes de abrir).
    #[must_use]
    pub fn kek_id(&self) -> &KekId {
        &self.kek_id
    }

    /// Bytes autenticados (AAD): prefijo fijo, nonce y dominio.
    pub(crate) fn aad(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(FIXED_PREFIX + 1 + self.nonce.len() + AAD_DOMAIN.len());
        self.write_prefix(&mut out);
        out.extend_from_slice(AAD_DOMAIN);
        out
    }

    fn write_prefix(&self, out: &mut Vec<u8>) {
        out.extend_from_slice(&MAGIC);
        out.push(FORMAT_VERSION);
        out.extend_from_slice(&self.suite.code().to_be_bytes());
        out.extend_from_slice(&self.context.tenant_id);
        out.extend_from_slice(&self.context.compartment_id);
        out.extend_from_slice(&self.context.object_id);
        out.extend_from_slice(&self.context.object_version.to_be_bytes());
        // El nonce mide siempre `suite.nonce_len()` (12): cabe en u8. `seal` y `decode` lo garantizan.
        out.push(u8::try_from(self.nonce.len()).unwrap_or(u8::MAX));
        out.extend_from_slice(&self.nonce);
    }

    /// Serializa la cabecera completa.
    pub(crate) fn encode(&self) -> Result<Vec<u8>, Error> {
        if self.wrapped_dek.is_empty() || self.wrapped_dek.len() > MAX_WRAPPED_DEK {
            return Err(Error::Unwrap);
        }
        let mut out = Vec::with_capacity(FIXED_PREFIX + 64 + self.wrapped_dek.len() + 80);
        self.write_prefix(&mut out);
        let kid = self.kek_id.as_bytes();
        out.push(u8::try_from(kid.len()).map_err(|_| Error::InvalidKekId)?); // 1..=64 por KekId
        out.extend_from_slice(kid);
        let wlen = u16::try_from(self.wrapped_dek.len()).map_err(|_| Error::Unwrap)?;
        out.extend_from_slice(&wlen.to_be_bytes());
        out.extend_from_slice(&self.wrapped_dek);
        Ok(out)
    }

    /// Decodifica una cabecera y devuelve `(cabecera, resto = ciphertext||tag)`.
    /// Nunca entra en pánico: toda lectura está acotada.
    pub(crate) fn decode(input: &[u8]) -> Result<(Header, &[u8]), Error> {
        let mut r = Reader { buf: input };
        if r.take(4, "magic")? != MAGIC {
            return Err(Error::Malformed("magic"));
        }
        let version = r.u8("version")?;
        if version != FORMAT_VERSION {
            return Err(Error::UnsupportedFormatVersion(version));
        }
        let suite = SuiteId::from_code(r.u16("suite")?)?;
        let context = ObjectContext {
            tenant_id: r.array16("tenant_id")?,
            compartment_id: r.array16("compartment_id")?,
            object_id: r.array16("object_id")?,
            object_version: r.u64("object_version")?,
        };
        let nonce_len = usize::from(r.u8("nonce_len")?);
        if nonce_len != suite.nonce_len() {
            return Err(Error::Malformed("nonce_len"));
        }
        let nonce = r.take(nonce_len, "nonce")?.to_vec();
        let kid_len = usize::from(r.u8("kek_id_len")?);
        let kek_id =
            KekId::new(r.take(kid_len, "kek_id")?).map_err(|_| Error::Malformed("kek_id"))?;
        let wlen = usize::from(r.u16("wrapped_dek_len")?);
        if wlen == 0 || wlen > MAX_WRAPPED_DEK {
            return Err(Error::Malformed("wrapped_dek_len"));
        }
        let wrapped_dek = r.take(wlen, "wrapped_dek")?.to_vec();
        if r.buf.len() < suite.tag_len() {
            return Err(Error::Malformed("ciphertext"));
        }
        Ok((
            Header {
                suite,
                context,
                nonce,
                kek_id,
                wrapped_dek,
            },
            r.buf,
        ))
    }
}

struct Reader<'a> {
    buf: &'a [u8],
}

impl<'a> Reader<'a> {
    fn take(&mut self, n: usize, what: &'static str) -> Result<&'a [u8], Error> {
        if self.buf.len() < n {
            return Err(Error::Malformed(what));
        }
        let (head, tail) = self.buf.split_at(n);
        self.buf = tail;
        Ok(head)
    }
    fn u8(&mut self, what: &'static str) -> Result<u8, Error> {
        Ok(self.take(1, what)?[0])
    }
    fn u16(&mut self, what: &'static str) -> Result<u16, Error> {
        let b = self.take(2, what)?;
        Ok(u16::from_be_bytes([b[0], b[1]]))
    }
    fn u64(&mut self, what: &'static str) -> Result<u64, Error> {
        let mut a = [0u8; 8];
        a.copy_from_slice(self.take(8, what)?);
        Ok(u64::from_be_bytes(a))
    }
    fn array16(&mut self, what: &'static str) -> Result<[u8; 16], Error> {
        let mut a = [0u8; 16];
        a.copy_from_slice(self.take(16, what)?);
        Ok(a)
    }
}
