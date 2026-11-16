use serde::{Deserialize, Serialize};

use crate::error::Error;

/// Identificador aleatorio de 128 bits (organización, carpeta u objeto).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Id(pub [u8; 16]);

impl Id {
    /// Genera un identificador aleatorio.
    ///
    /// # Errors
    /// [`Error::Rng`] si falla el generador del sistema.
    pub fn random() -> Result<Self, Error> {
        let mut b = [0u8; 16];
        getrandom::getrandom(&mut b).map_err(|_| Error::Rng)?;
        Ok(Id(b))
    }

    /// Representación hexadecimal (nombres de carpeta en disco y en el registro).
    #[must_use]
    pub fn hex(&self) -> String {
        hex::encode(self.0)
    }
}

impl TryFrom<String> for Id {
    type Error = String;
    fn try_from(s: String) -> Result<Self, String> {
        let v = hex::decode(&s).map_err(|e| e.to_string())?;
        let a: [u8; 16] = v
            .try_into()
            .map_err(|_| "longitud de id inválida".to_string())?;
        Ok(Id(a))
    }
}

impl From<Id> for String {
    fn from(id: Id) -> String {
        id.hex()
    }
}

/// Identificador reservado para el índice cifrado de cada carpeta.
pub const MANIFEST_OBJECT: Id = Id([0u8; 16]);
