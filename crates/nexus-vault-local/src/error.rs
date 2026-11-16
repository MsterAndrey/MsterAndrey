use core::fmt;

/// Errores del almacén local. No contienen claves, nombres de archivo ni contenido.
#[derive(Debug)]
#[non_exhaustive]
pub enum Error {
    /// Error de entrada/salida del sistema de archivos.
    Io(std::io::Error),
    /// Error criptográfico (objeto manipulado, clave equivocada, formato inválido…).
    Crypto(nexus_envelope::Error),
    /// Metadatos dañados o con formato inesperado.
    Corrupt(&'static str),
    /// La carpeta protegida no existe.
    UnknownCompartment,
    /// El archivo o la versión no existen.
    UnknownFile,
    /// Se detectó que el índice cifrado volvió a una versión anterior (posible manipulación).
    RollbackDetected { esperado: u64, encontrado: u64 },
    /// El registro de actividad fue alterado en la entrada indicada.
    AuditTampered { linea: usize },
    /// La carpeta de destino de una recuperación ya existe y no está vacía.
    DestinationNotEmpty,
    /// Nombre de archivo no permitido (vacío, con rutas o caracteres de control).
    InvalidName,
    /// Fallo del generador aleatorio del sistema.
    Rng,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Io(e) => write!(f, "error de archivo: {e}"),
            Error::Crypto(e) => write!(f, "error criptográfico: {e}"),
            Error::Corrupt(w) => write!(f, "metadatos dañados: {w}"),
            Error::UnknownCompartment => f.write_str("la carpeta protegida no existe"),
            Error::UnknownFile => f.write_str("el archivo o la versión no existen"),
            Error::RollbackDetected {
                esperado,
                encontrado,
            } => write!(
                f,
                "el índice volvió a una versión anterior (esperada ≥ {esperado}, encontrada {encontrado}): posible manipulación"
            ),
            Error::AuditTampered { linea } => write!(
                f,
                "el registro de actividad fue alterado en la entrada {linea}"
            ),
            Error::DestinationNotEmpty => {
                f.write_str("la carpeta de destino ya existe y no está vacía")
            }
            Error::InvalidName => f.write_str("nombre de archivo no permitido"),
            Error::Rng => f.write_str("fallo del generador aleatorio del sistema"),
        }
    }
}

impl std::error::Error for Error {}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Error::Io(e)
    }
}

impl From<nexus_envelope::Error> for Error {
    fn from(e: nexus_envelope::Error) -> Self {
        Error::Crypto(e)
    }
}
