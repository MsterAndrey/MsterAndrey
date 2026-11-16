# Resultados — nexus-envelope 0.1.0 (prototipo Fase 1)

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Componente | `crates/nexus-envelope` |
| Entorno | Linux x86_64 (contenedor de desarrollo), Rust 1.97.0 estable; fuzzing con nightly + cargo-fuzz 0.13.2 |
| Ejecutado por | Asistente de desarrollo (Claude), a petición del fundador |
| Revisión externa | **No realizada** |

## Resultados

| Prueba | Resultado |
|---|---|
| Pruebas de propiedades de seguridad (`tests/envelope.rs`) | 15/15 pasan |
| Pruebas basadas en propiedades (`tests/properties.rs`, proptest, 512 casos por propiedad) | 4/4 pasan |
| Wycheproof AES-256-GCM (nonce 96 bits) | 39 válidos y 27 inválidos: todos con el resultado esperado |
| Wycheproof AES-256-KWP | 25 válidos y 69 inválidos: todos con el resultado esperado (1 caso inválido sólo vía `SoftwareKek`, ver hallazgo H-1) |
| Las mismas pruebas en `--release` (con `overflow-checks`) | Pasan |
| `cargo clippy --all-targets -D warnings` | Sin avisos |
| `cargo clippy --lib -W clippy::pedantic -D warnings` | Sin avisos |
| Fuzzing `decode_open` (bytes arbitrarios como objeto) | 21 842 482 ejecuciones en 181 s, sin fallos (cobertura: 160 bordes). Con semillas de cabecera válida: 14 967 335 ejecuciones en 121 s, sin fallos (216 bordes) |
| Fuzzing `seal_open` (ida y vuelta + bit alterado) | 1 879 598 ejecuciones en 181 s, sin fallos (703 bordes) |

**Veredicto según los criterios de [docs/15 §15.4](../15-plan-pruebas.md#154-criterios-objetivos-de-aprobación-y-rechazo):** ningún criterio de rechazo aplicable se activa en este componente. **No cumple todavía la salida de Fase 1**, que exige además una revisión criptográfica externa sin hallazgos críticos abiertos, y no se midió la cobertura de ramas (criterio 8).

Los tiempos de fuzzing son cortos (minutos); el plan exige fuzzing continuo (≥ 24 h por semana y objetivo).

## Hallazgos

### H-1 — Pánico en la dependencia `aes-kw` 0.2.1 (severidad baja para este crate)
- **Qué:** `KekAes256::unwrap_with_padding` con una entrada de 8 bytes hace `n - 1` con `n = 0`. En compilación de depuración, el desbordamiento provoca un pánico. Lo detectó un vector inválido de Wycheproof.
- **Impacto en nexus-envelope:** ninguno. `SoftwareKek::unwrap` exige exactamente 40 bytes antes de llamar a la librería (prueba de regresión `dek_envuelta_de_longitud_invalida_no_provoca_panico`).
- **Acciones:** se activó `overflow-checks = true` en el perfil `release` del workspace. La versión 0.3.1 de `aes-kw` reestructura esa validación; evaluar migrar cuando se actualice `aes-gcm`. Opcional: reportarlo a RustCrypto si sigue presente en versiones mantenidas.

### H-2 — Corrección de la especificación del AAD (docs/02 §2.4)
- **Qué:** la especificación original incluía `kek_id` en el AAD. Al implementar la rotación de KEK se comprobó que eso obligaría a volver a cifrar los datos al rotar, lo que contradice el objetivo P8 de la rotación sin re-cifrado.
- **Decisión:** el AAD cubre `magic, versión, suite, organización, compartimento, objeto, versión del objeto y nonce`. `kek_id` y `wrapped_dek` quedan fuera. Sustituir `wrapped_dek` sólo produce otra DEK y el descifrado falla (prueba `intercambiar_dek_envuelta_entre_objetos_falla`).
- **Estado:** especificación actualizada. **Debe revisarlo el criptógrafo externo.**

## Reproducir
Ver los comandos en [crates/nexus-envelope/README.md](../../crates/nexus-envelope/README.md#comandos).
