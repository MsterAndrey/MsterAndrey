# nexus-envelope

Librería de cifrado de objetos de **NEXUS VAULT**: cada objeto se cifra con una clave de datos (DEK) propia,
y esa DEK se guarda envuelta por la clave del compartimento (KEK). Formato `NCOBJ v1`.

> **Prototipo de Fase 1 (Etapa 4).** No auditado. **No usar con datos reales** hasta superar la revisión
> criptográfica externa prevista en la hoja de ruta.

## Qué garantiza (y cómo se comprueba)

| Propiedad | Prueba |
|---|---|
| DEK y nonce nuevos en cada cifrado | `cada_sellado_usa_dek_y_nonce_nuevos` |
| Un objeto de la organización A no se puede abrir como si fuera de B, aunque se reescriba la cabecera | `mover_objeto_a_otra_organizacion_falla_criptograficamente` |
| No se puede hacer *rollback* de versión | `rollback_de_version_falla_criptograficamente` |
| Ningún bit alterado produce un descifrado exitoso | `cualquier_byte_alterado…`, `ningun_bit_alterado_pasa` (proptest) |
| Rotar la KEK no requiere volver a cifrar los datos | `rotacion_de_kek_sin_recifrar` |
| Suites o versiones desconocidas se rechazan | `suite_y_version_desconocidas_se_rechazan` |
| El parser no entra en pánico con ninguna entrada | `truncado_…`, proptest y fuzzing (`fuzz/`) |
| Las claves no aparecen en `Debug` y se borran de memoria | `las_claves_no_aparecen_en_debug`, uso de `zeroize` |
| Las primitivas se comportan según los vectores de Wycheproof | `tests/wycheproof.rs` |

Resultados de la última ejecución: [docs/resultados/2026-11-16-nexus-envelope.md](../../docs/resultados/2026-11-16-nexus-envelope.md).

## Uso

```rust
use nexus_envelope::{open, seal, KekId, ObjectContext, SoftwareKek};

let kek = SoftwareKek::generate(KekId::new("compartimento-7/kek-v1")?)?; // en producción: HSM/KMS
let ctx = ObjectContext { tenant_id: [1; 16], compartment_id: [7; 16], object_id: [42; 16], object_version: 1 };
let sealed = seal(&kek, &ctx, b"contenido")?;
let plain = open(&kek, &ctx, &sealed)?; // se borra de memoria al liberarse
```

En producción, `KeyWrapper` se implementa sobre un HSM o KMS; `SoftwareKek` existe sólo para pruebas.

## Comandos

```bash
cargo test -p nexus-envelope                     # pruebas (incluye vectores Wycheproof y proptest)
cargo test -p nexus-envelope --release           # igual, con optimizaciones (overflow-checks activos)
cargo clippy -p nexus-envelope --all-targets -- -D warnings -W clippy::pedantic
cd crates/nexus-envelope/fuzz && cargo +nightly fuzz run decode_open seeds/decode_open -- -max_total_time=300
cd crates/nexus-envelope/fuzz && cargo +nightly fuzz run seal_open -- -max_total_time=300
```

## Limitaciones conocidas

- Cifrado en memoria (máx. 256 MiB por objeto). El cifrado por bloques (streaming) está pendiente.
- `SoftwareKek` no es apta para producción: la KEK está en memoria del proceso.
- No se ha verificado que `aes-gcm`/`aes` borren de memoria las tablas de claves expandidas al liberarse.
- La protección frente a ataques de canal lateral depende de la implementación AES subyacente
  (AES-NI cuando el procesador lo soporta). No evaluada.
- `aes-kw` 0.2.1 entra en pánico al desenvolver entradas de 8 bytes en compilación de depuración
  (desbordamiento en `n - 1`). `SoftwareKek` valida la longitud antes, y hay una prueba de regresión.
