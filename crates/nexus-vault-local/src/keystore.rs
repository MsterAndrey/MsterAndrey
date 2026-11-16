//! Custodia de las claves de carpeta (KEK).

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use nexus_envelope::{KekId, KeyWrapper, SoftwareKek};
use zeroize::Zeroizing;

use crate::error::Error;
use crate::ids::Id;

/// Proveedor de KEKs por carpeta. En producción: TPM 2.0 (Windows Platform Crypto Provider).
pub trait KeyStore {
    /// Crea la KEK de una carpeta nueva.
    ///
    /// # Errors
    /// Si no se puede crear o ya existe.
    fn create(&self, compartment: &Id) -> Result<Box<dyn KeyWrapper>, Error>;
    /// Obtiene la KEK de una carpeta existente.
    ///
    /// # Errors
    /// Si no existe o no se puede leer.
    fn get(&self, compartment: &Id) -> Result<Box<dyn KeyWrapper>, Error>;
}

/// **SÓLO PARA DESARROLLO Y PRUEBAS.** Guarda cada KEK en un archivo, sin protección de hardware.
/// Cualquiera que copie la carpeta `keys/` puede descifrar el almacén. Será sustituido por el
/// almacén con TPM 2.0 (ADR-0012) antes de usar datos reales.
pub struct DevFileKeyStore {
    dir: PathBuf,
}

impl DevFileKeyStore {
    /// Usa (y crea si hace falta) el directorio de claves de desarrollo.
    ///
    /// # Errors
    /// Si no se puede crear el directorio.
    pub fn new(dir: impl AsRef<Path>) -> Result<Self, Error> {
        fs::create_dir_all(dir.as_ref())?;
        Ok(DevFileKeyStore {
            dir: dir.as_ref().to_path_buf(),
        })
    }

    fn path(&self, c: &Id) -> PathBuf {
        self.dir.join(format!("{}.dev-kek", c.hex()))
    }

    fn kek_id(c: &Id) -> Result<KekId, Error> {
        KekId::new(format!("dev/{}/v1", c.hex())).map_err(Error::Crypto)
    }
}

impl KeyStore for DevFileKeyStore {
    fn create(&self, compartment: &Id) -> Result<Box<dyn KeyWrapper>, Error> {
        let mut key = Zeroizing::new([0u8; 32]);
        getrandom::getrandom(key.as_mut()).map_err(|_| Error::Rng)?;
        let mut opts = fs::OpenOptions::new();
        opts.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            opts.mode(0o600);
        }
        let mut f = opts.open(self.path(compartment))?;
        f.write_all(key.as_ref())?;
        f.sync_all()?;
        Ok(Box::new(SoftwareKek::from_bytes(
            Self::kek_id(compartment)?,
            *key,
        )))
    }

    fn get(&self, compartment: &Id) -> Result<Box<dyn KeyWrapper>, Error> {
        let bytes = Zeroizing::new(fs::read(self.path(compartment))?);
        let key: [u8; 32] = bytes
            .as_slice()
            .try_into()
            .map_err(|_| Error::Corrupt("clave de desarrollo"))?;
        Ok(Box::new(SoftwareKek::from_bytes(
            Self::kek_id(compartment)?,
            key,
        )))
    }
}
