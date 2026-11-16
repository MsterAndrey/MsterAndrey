//! Claves de datos (DEK) y claves de envoltura (KEK).

use core::fmt;

use aes_kw::KekAes256;
use zeroize::{Zeroize, Zeroizing};

use crate::error::Error;

/// Clave de datos AES-256 de un único objeto/versión.
///
/// No implementa `Clone` ni muestra su contenido en `Debug`; se borra de memoria al liberarse.
pub struct Dek(Zeroizing<[u8; 32]>);

impl Dek {
    pub(crate) fn generate() -> Result<Self, Error> {
        use aes_gcm::aead::{OsRng, rand_core::RngCore};
        let mut k = Zeroizing::new([0u8; 32]);
        OsRng.try_fill_bytes(k.as_mut()).map_err(|_| Error::Rng)?;
        Ok(Dek(k))
    }

    /// Construye una DEK a partir de bytes ya desenvueltos (uso de implementaciones de [`KeyWrapper`]).
    #[must_use]
    pub fn from_bytes(mut bytes: [u8; 32]) -> Self {
        let dek = Dek(Zeroizing::new(bytes));
        bytes.zeroize();
        dek
    }

    /// Acceso a los bytes de la clave (sólo para pasarlos a la primitiva o al HSM).
    #[must_use]
    pub fn expose(&self) -> &[u8; 32] {
        &self.0
    }
}

impl fmt::Debug for Dek {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Dek(<oculta>)")
    }
}

/// Identificador de una KEK y su versión, p. ej. `"comp-7/kek-v3"`. 1 a 64 bytes.
#[derive(Clone, PartialEq, Eq, Hash)]
pub struct KekId(Vec<u8>);

impl KekId {
    /// Crea un identificador (1..=64 bytes).
    ///
    /// # Errors
    /// [`Error::InvalidKekId`] si está vacío o supera 64 bytes.
    pub fn new(id: impl AsRef<[u8]>) -> Result<Self, Error> {
        let id = id.as_ref();
        if id.is_empty() || id.len() > 64 {
            return Err(Error::InvalidKekId);
        }
        Ok(KekId(id.to_vec()))
    }
    /// Bytes del identificador.
    #[must_use]
    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }
}

impl fmt::Debug for KekId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "KekId({})", String::from_utf8_lossy(&self.0))
    }
}

/// Envoltura de DEKs con una KEK que **nunca sale** de la implementación.
///
/// En producción se implementa sobre un HSM o KMS (PKCS#11, KMIP, KMS del proveedor cloud),
/// que además aplica control de acceso, cuotas y auditoría a cada operación.
pub trait KeyWrapper {
    /// Identificador de la KEK (se guarda en la cabecera del objeto).
    fn kek_id(&self) -> &KekId;
    /// Envuelve la DEK.
    ///
    /// # Errors
    /// [`Error::Unwrap`] si la operación falla.
    fn wrap(&self, dek: &Dek) -> Result<Vec<u8>, Error>;
    /// Desenvuelve una DEK.
    ///
    /// # Errors
    /// Debe devolver [`Error::Unwrap`] si `wrapped` no fue producida por esta KEK o está manipulada.
    fn unwrap(&self, wrapped: &[u8]) -> Result<Dek, Error>;
}

/// KEK en memoria con AES-256-KWP (NIST SP 800-38F, RFC 5649): suite `NC-WRAP-1`.
///
/// **Sólo para pruebas y desarrollo.** En producción la KEK debe vivir en un HSM/KMS.
pub struct SoftwareKek {
    id: KekId,
    key: Zeroizing<[u8; 32]>,
}

impl SoftwareKek {
    /// Genera una KEK aleatoria.
    ///
    /// # Errors
    /// [`Error::Rng`] si falla el generador aleatorio del sistema.
    pub fn generate(id: KekId) -> Result<Self, Error> {
        use aes_gcm::aead::{OsRng, rand_core::RngCore};
        let mut key = Zeroizing::new([0u8; 32]);
        OsRng.try_fill_bytes(key.as_mut()).map_err(|_| Error::Rng)?;
        Ok(SoftwareKek { id, key })
    }

    /// Crea una KEK a partir de bytes conocidos (vectores de prueba).
    #[must_use]
    pub fn from_bytes(id: KekId, mut key: [u8; 32]) -> Self {
        let k = SoftwareKek {
            id,
            key: Zeroizing::new(key),
        };
        key.zeroize();
        k
    }

    fn kw(&self) -> KekAes256 {
        KekAes256::from(*self.key)
    }
}

impl fmt::Debug for SoftwareKek {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("SoftwareKek")
            .field("id", &self.id)
            .field("key", &"<oculta>")
            .finish()
    }
}

impl KeyWrapper for SoftwareKek {
    fn kek_id(&self) -> &KekId {
        &self.id
    }

    fn wrap(&self, dek: &Dek) -> Result<Vec<u8>, Error> {
        self.kw()
            .wrap_with_padding_vec(dek.expose())
            .map_err(|_| Error::Unwrap)
    }

    fn unwrap(&self, wrapped: &[u8]) -> Result<Dek, Error> {
        // Una DEK de 32 bytes envuelta con KWP ocupa exactamente 40 bytes.
        if wrapped.len() != 40 {
            return Err(Error::Unwrap);
        }
        let mut out = Zeroizing::new([0u8; 32]);
        let plain = self
            .kw()
            .unwrap_with_padding(wrapped, out.as_mut())
            .map_err(|_| Error::Unwrap)?;
        if plain.len() != 32 {
            return Err(Error::Unwrap);
        }
        Ok(Dek(out))
    }
}
