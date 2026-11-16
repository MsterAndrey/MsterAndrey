# Resultados — nexus-vault-local 0.1.0 (motor del almacén local)

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Componente | `crates/nexus-vault-local` |
| Entorno | Linux x86_64, Rust 1.97.0; comprobación de compilación para `x86_64-pc-windows-gnu` |
| Revisión externa | **No realizada** |

## Resultados
- 12 pruebas de seguridad y funcionamiento: **pasan** (ver la tabla del [README](../../crates/nexus-vault-local/README.md)).
- Todo el proyecto: 55 pruebas, **pasan**. `cargo clippy -D warnings`: sin avisos.

## Decisiones tomadas al implementar
- **Nombres cifrados:** los nombres de archivo y de carpeta viven sólo en un índice cifrado y versionado (`manifest/v<N>`), vinculado a su carpeta como cualquier otro objeto.
- **Detección de rollback del índice:** cada evento del registro anota la versión del índice. Si en disco hay una versión menor que la registrada, el almacén lo rechaza.
- **Registro sin datos sensibles:** sólo identificadores aleatorios (regla 10). La interfaz traduce identificadores a nombres usando el índice descifrado.
- **Recuperación segura:** siempre en una carpeta nueva y vacía, con nombres validados contra recorridos de ruta (`../`, `\`, `:`).

## Pendiente
- Almacén de claves con TPM 2.0 (Windows Platform Crypto Provider) y prueba en Windows real.
- Integración en la aplicación de escritorio (Tauri) con confirmación por Windows Hello.
- Testigos externos para detectar el truncado del final del registro (NEXUS TRUST).
