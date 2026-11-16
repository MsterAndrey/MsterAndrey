//! # nexus-tpm
//!
//! - [`TpmKeyStore`]: guarda la clave de cada carpeta (KEK) **cifrada por una clave RSA que vive dentro del
//!   TPM 2.0** del equipo (Microsoft Platform Crypto Provider). La clave del TPM no se puede exportar: el archivo
//!   de claves copiado a otro equipo no sirve (ADR-0012).
//! - [`windows_hello`]: pide a Windows que verifique a la persona (huella, rostro o PIN) antes de una acción.
//!
//! Este crate contiene `unsafe` para llamar a la API de Windows; está aislado aquí a propósito.
//! **Prototipo, no auditado.** Sólo funciona en Windows con TPM 2.0.
#![deny(unsafe_op_in_unsafe_fn)]

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use nexus_envelope::{KekId, KeyWrapper, SoftwareKek};
use nexus_vault_local::{Error, Id, KeyStore};
use zeroize::Zeroizing;

#[cfg(windows)]
mod ncrypt;

/// Nombre de la clave raíz persistente dentro del TPM.
pub const ROOT_KEY_NAME: &str = "NexusCube-Vault-Root-v1";

/// Almacén de KEKs protegido por el TPM 2.0.
pub struct TpmKeyStore {
    dir: PathBuf,
}

impl TpmKeyStore {
    /// Abre el almacén y crea (si no existe) la clave raíz en el TPM.
    ///
    /// # Errors
    /// [`Error::KeyStore`] si no hay TPM 2.0 utilizable o no es Windows.
    pub fn open(dir: impl AsRef<Path>) -> Result<Self, Error> {
        fs::create_dir_all(dir.as_ref())?;
        #[cfg(windows)]
        ncrypt::ensure_root_key(ROOT_KEY_NAME)?;
        #[cfg(not(windows))]
        return Err(Error::KeyStore(
            "el almacén con TPM sólo está disponible en Windows".into(),
        ));
        #[cfg(windows)]
        Ok(TpmKeyStore {
            dir: dir.as_ref().to_path_buf(),
        })
    }

    fn path(&self, c: &Id) -> PathBuf {
        self.dir.join(format!("{}.tpm-kek", c.hex()))
    }

    fn kek_id(c: &Id) -> Result<KekId, Error> {
        KekId::new(format!("tpm/{}/v1", c.hex())).map_err(Error::Crypto)
    }
}

impl KeyStore for TpmKeyStore {
    fn create(&self, compartment: &Id) -> Result<Box<dyn KeyWrapper>, Error> {
        let mut kek = Zeroizing::new([0u8; 32]);
        getrandom::getrandom(kek.as_mut()).map_err(|_| Error::Rng)?;
        let wrapped = tpm_encrypt(kek.as_ref())?;
        let mut f = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(self.path(compartment))?;
        f.write_all(&wrapped)?;
        f.sync_all()?;
        Ok(Box::new(SoftwareKek::from_bytes(
            Self::kek_id(compartment)?,
            *kek,
        )))
    }

    fn get(&self, compartment: &Id) -> Result<Box<dyn KeyWrapper>, Error> {
        let wrapped = fs::read(self.path(compartment))?;
        let plain = tpm_decrypt(&wrapped)?;
        let kek: [u8; 32] = plain
            .as_slice()
            .try_into()
            .map_err(|_| Error::Corrupt("clave protegida por TPM"))?;
        Ok(Box::new(SoftwareKek::from_bytes(
            Self::kek_id(compartment)?,
            kek,
        )))
    }
}

#[cfg(windows)]
fn tpm_encrypt(data: &[u8]) -> Result<Vec<u8>, Error> {
    ncrypt::encrypt(ROOT_KEY_NAME, data)
}
#[cfg(windows)]
fn tpm_decrypt(data: &[u8]) -> Result<Zeroizing<Vec<u8>>, Error> {
    ncrypt::decrypt(ROOT_KEY_NAME, data)
}
#[cfg(not(windows))]
fn tpm_encrypt(_: &[u8]) -> Result<Vec<u8>, Error> {
    Err(Error::KeyStore("TPM no disponible fuera de Windows".into()))
}
#[cfg(not(windows))]
fn tpm_decrypt(_: &[u8]) -> Result<Zeroizing<Vec<u8>>, Error> {
    Err(Error::KeyStore("TPM no disponible fuera de Windows".into()))
}

/// Resultado de pedir la verificación de Windows Hello.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HelloResult {
    /// La persona fue verificada.
    Verified,
    /// La persona canceló.
    Canceled,
    /// Windows Hello no está configurado o no hay dispositivo.
    NotAvailable,
    /// Otro resultado (bloqueado por demasiados intentos, política, etc.).
    Failed,
}

/// Pide a Windows que verifique a la persona mostrando `message`. Bloquea hasta que responda.
///
/// # Errors
/// [`Error::KeyStore`] si la API no está disponible.
pub fn windows_hello(message: &str) -> Result<HelloResult, Error> {
    #[cfg(windows)]
    {
        ncrypt::hello(message)
    }
    #[cfg(not(windows))]
    {
        let _ = message;
        Err(Error::KeyStore(
            "Windows Hello sólo está disponible en Windows".into(),
        ))
    }
}

/// Como [`windows_hello`], pero el diálogo se muestra sobre la ventana `hwnd` de la aplicación.
///
/// # Errors
/// [`Error::KeyStore`] si la API no está disponible.
pub fn windows_hello_for_window(hwnd: isize, message: &str) -> Result<HelloResult, Error> {
    #[cfg(windows)]
    {
        ncrypt::hello_for_window(hwnd, message)
    }
    #[cfg(not(windows))]
    {
        let _ = (hwnd, message);
        Err(Error::KeyStore(
            "Windows Hello sólo está disponible en Windows".into(),
        ))
    }
}
