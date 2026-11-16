//! Llamadas a la API de Windows (CNG/NCrypt y WinRT). Todo el `unsafe` del proyecto vive aquí.

use nexus_vault_local::Error;
use windows::Security::Credentials::UI::{UserConsentVerificationResult, UserConsentVerifier};
use windows::Win32::Security::Cryptography::{
    BCRYPT_OAEP_PADDING_INFO, BCRYPT_RSA_ALGORITHM, BCRYPT_SHA256_ALGORITHM, CERT_KEY_SPEC,
    MS_PLATFORM_CRYPTO_PROVIDER, NCRYPT_FLAGS, NCRYPT_HANDLE, NCRYPT_KEY_HANDLE,
    NCRYPT_PAD_OAEP_FLAG, NCRYPT_PROV_HANDLE, NCryptCreatePersistedKey, NCryptDecrypt,
    NCryptEncrypt, NCryptFinalizeKey, NCryptFreeObject, NCryptOpenKey, NCryptOpenStorageProvider,
};
use windows::core::{HSTRING, PCWSTR};
use zeroize::Zeroizing;

fn err(what: &str, e: &windows::core::Error) -> Error {
    Error::KeyStore(format!("{what}: {} (0x{:08X})", e.message(), e.code().0))
}

/// Libera manejadores NCrypt al salir del ámbito.
struct Handle(NCRYPT_HANDLE);
impl Drop for Handle {
    fn drop(&mut self) {
        if self.0.0 != 0 {
            // SAFETY: el manejador fue devuelto por NCrypt y se libera una sola vez.
            let _ = unsafe { NCryptFreeObject(self.0) };
        }
    }
}

fn provider() -> Result<(NCRYPT_PROV_HANDLE, Handle), Error> {
    let mut prov = NCRYPT_PROV_HANDLE::default();
    // SAFETY: `prov` es un puntero válido; el nombre del proveedor es una constante de Windows.
    unsafe { NCryptOpenStorageProvider(&mut prov, MS_PLATFORM_CRYPTO_PROVIDER, 0) }.map_err(
        |e| {
            err(
                "no se pudo abrir el proveedor del TPM (¿hay TPM 2.0 activo?)",
                &e,
            )
        },
    )?;
    Ok((prov, Handle(NCRYPT_HANDLE(prov.0))))
}

fn open_key(prov: NCRYPT_PROV_HANDLE, name: &HSTRING) -> windows::core::Result<NCRYPT_KEY_HANDLE> {
    let mut key = NCRYPT_KEY_HANDLE::default();
    // SAFETY: punteros válidos durante la llamada.
    unsafe {
        NCryptOpenKey(
            prov,
            &mut key,
            PCWSTR(name.as_ptr()),
            CERT_KEY_SPEC(0),
            NCRYPT_FLAGS(0),
        )
    }?;
    Ok(key)
}

/// Crea la clave RSA-2048 persistente en el TPM si no existe. No es exportable (valor por defecto del TPM).
pub fn ensure_root_key(name: &str) -> Result<(), Error> {
    let (prov, _p) = provider()?;
    let hname = HSTRING::from(name);
    if let Ok(k) = open_key(prov, &hname) {
        drop(Handle(NCRYPT_HANDLE(k.0)));
        return Ok(());
    }
    let mut key = NCRYPT_KEY_HANDLE::default();
    // SAFETY: punteros válidos; algoritmo y nombre son cadenas válidas terminadas en nulo.
    unsafe {
        NCryptCreatePersistedKey(
            prov,
            &mut key,
            BCRYPT_RSA_ALGORITHM,
            PCWSTR(hname.as_ptr()),
            CERT_KEY_SPEC(0),
            NCRYPT_FLAGS(0),
        )
    }
    .map_err(|e| err("no se pudo crear la clave en el TPM", &e))?;
    let _k = Handle(NCRYPT_HANDLE(key.0));
    // SAFETY: `key` es un manejador válido recién creado.
    unsafe { NCryptFinalizeKey(key, NCRYPT_FLAGS(0)) }
        .map_err(|e| err("no se pudo finalizar la clave en el TPM", &e))?;
    Ok(())
}

fn padding() -> BCRYPT_OAEP_PADDING_INFO {
    BCRYPT_OAEP_PADDING_INFO {
        pszAlgId: BCRYPT_SHA256_ALGORITHM,
        pbLabel: std::ptr::null_mut(),
        cbLabel: 0,
    }
}

fn with_key<T>(
    name: &str,
    f: impl FnOnce(NCRYPT_KEY_HANDLE) -> Result<T, Error>,
) -> Result<T, Error> {
    let (prov, _p) = provider()?;
    let key = open_key(prov, &HSTRING::from(name))
        .map_err(|e| err("no se encontró la clave raíz en el TPM", &e))?;
    let _k = Handle(NCRYPT_HANDLE(key.0));
    f(key)
}

/// Cifra `data` (RSA-OAEP con SHA-256) con la clave raíz del TPM.
pub fn encrypt(name: &str, data: &[u8]) -> Result<Vec<u8>, Error> {
    with_key(name, |key| {
        let pad = padding();
        let mut len = 0u32;
        // SAFETY: primera llamada sólo para conocer el tamaño de salida.
        unsafe {
            NCryptEncrypt(
                key,
                Some(data),
                Some(std::ptr::from_ref(&pad).cast()),
                None,
                &mut len,
                NCRYPT_PAD_OAEP_FLAG,
            )
        }
        .map_err(|e| err("cifrado con TPM (tamaño)", &e))?;
        let mut out = vec![0u8; len as usize];
        // SAFETY: `out` tiene exactamente `len` bytes.
        unsafe {
            NCryptEncrypt(
                key,
                Some(data),
                Some(std::ptr::from_ref(&pad).cast()),
                Some(&mut out),
                &mut len,
                NCRYPT_PAD_OAEP_FLAG,
            )
        }
        .map_err(|e| err("cifrado con TPM", &e))?;
        out.truncate(len as usize);
        Ok(out)
    })
}

/// Descifra con la clave raíz del TPM. El resultado se borra de memoria al liberarse.
pub fn decrypt(name: &str, data: &[u8]) -> Result<Zeroizing<Vec<u8>>, Error> {
    with_key(name, |key| {
        let pad = padding();
        let mut len = 0u32;
        // SAFETY: primera llamada sólo para conocer el tamaño de salida.
        unsafe {
            NCryptDecrypt(
                key,
                Some(data),
                Some(std::ptr::from_ref(&pad).cast()),
                None,
                &mut len,
                NCRYPT_PAD_OAEP_FLAG,
            )
        }
        .map_err(|e| err("descifrado con TPM (tamaño)", &e))?;
        let mut out = Zeroizing::new(vec![0u8; len as usize]);
        // SAFETY: `out` tiene exactamente `len` bytes.
        unsafe {
            NCryptDecrypt(
                key,
                Some(data),
                Some(std::ptr::from_ref(&pad).cast()),
                Some(out.as_mut_slice()),
                &mut len,
                NCRYPT_PAD_OAEP_FLAG,
            )
        }
        .map_err(|e| err("descifrado con TPM", &e))?;
        out.truncate(len as usize);
        Ok(out)
    })
}

/// Verificación con Windows Hello (WinRT `UserConsentVerifier`).
pub fn hello(message: &str) -> Result<super::HelloResult, Error> {
    let op = UserConsentVerifier::RequestVerificationAsync(&HSTRING::from(message))
        .map_err(|e| err("Windows Hello no disponible", &e))?;
    map_result(op.get().map_err(|e| err("Windows Hello", &e))?)
}

/// Verificación con Windows Hello asociada a una ventana de escritorio (el diálogo aparece encima de ella).
pub fn hello_for_window(hwnd: isize, message: &str) -> Result<super::HelloResult, Error> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::WinRT::IUserConsentVerifierInterop;
    use windows_future::IAsyncOperation;
    let interop = windows::core::factory::<UserConsentVerifier, IUserConsentVerifierInterop>()
        .map_err(|e| err("Windows Hello no disponible", &e))?;
    // SAFETY: `hwnd` es el manejador de una ventana viva de esta aplicación (lo garantiza el llamador).
    let op: IAsyncOperation<UserConsentVerificationResult> = unsafe {
        interop.RequestVerificationForWindowAsync(
            HWND(hwnd as *mut core::ffi::c_void),
            &HSTRING::from(message),
        )
    }
    .map_err(|e| err("Windows Hello no disponible", &e))?;
    map_result(op.get().map_err(|e| err("Windows Hello", &e))?)
}

fn map_result(r: UserConsentVerificationResult) -> Result<super::HelloResult, Error> {
    use super::HelloResult;
    Ok(match r {
        UserConsentVerificationResult::Verified => HelloResult::Verified,
        UserConsentVerificationResult::Canceled => HelloResult::Canceled,
        UserConsentVerificationResult::DeviceNotPresent
        | UserConsentVerificationResult::NotConfiguredForUser => HelloResult::NotAvailable,
        _ => HelloResult::Failed,
    })
}
