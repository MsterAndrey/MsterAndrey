use core::fmt;

/// Errores de `nexus-envelope`.
///
/// Los fallos criptográficos se agrupan deliberadamente ([`Error::Decryption`], [`Error::Unwrap`])
/// para no dar a un atacante información sobre *qué* falló. Ningún error contiene material de claves.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub enum Error {
    /// La entrada no tiene el formato NCOBJ (truncada, longitudes inválidas, magic incorrecto…).
    Malformed(&'static str),
    /// Versión de formato no soportada.
    UnsupportedFormatVersion(u8),
    /// Suite criptográfica desconocida o no habilitada.
    UnsupportedSuite(u16),
    /// La cabecera no corresponde al objeto que se esperaba abrir.
    ContextMismatch,
    /// El objeto está envuelto con otra KEK distinta a la proporcionada.
    KekMismatch,
    /// No se pudo envolver/desenvolver la DEK.
    Unwrap,
    /// Falló la autenticación del texto cifrado (datos o cabecera manipulados, o clave incorrecta).
    Decryption,
    /// El texto plano supera [`crate::MAX_PLAINTEXT_LEN`].
    TooLarge,
    /// Identificador de KEK inválido.
    InvalidKekId,
    /// El generador aleatorio del sistema operativo falló.
    Rng,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Malformed(what) => write!(f, "objeto NCOBJ mal formado: {what}"),
            Error::UnsupportedFormatVersion(v) => write!(f, "versión de formato no soportada: {v}"),
            Error::UnsupportedSuite(s) => write!(f, "suite criptográfica no soportada: 0x{s:04x}"),
            Error::ContextMismatch => f.write_str("el objeto no corresponde al contexto esperado"),
            Error::KekMismatch => f.write_str("el objeto está envuelto con otra KEK"),
            Error::Unwrap => f.write_str("no se pudo envolver o desenvolver la clave de datos"),
            Error::Decryption => f.write_str("fallo de autenticación al descifrar"),
            Error::TooLarge => f.write_str("el texto plano es demasiado grande"),
            Error::InvalidKekId => f.write_str("identificador de KEK inválido"),
            Error::Rng => f.write_str("fallo del generador aleatorio del sistema"),
        }
    }
}

impl std::error::Error for Error {}
