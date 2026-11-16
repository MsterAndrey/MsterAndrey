# ADR-0010 — Web independiente y distribución controlada

**Estado:** Propuesto (por decisión del fundador, ronda 1)

## Decisión
- La web es estática, sólo de presentación, en una infraestructura separada y sin conexión al producto.
- Sin descargas públicas. La solicitud llega por correo y sigue este proceso: verificación de la empresa, contrato, registro de una llave FIDO2 del administrador, descarga desde un portal separado con autenticación por passkey, verificación del hash por un segundo canal e inscripción de los equipos con atestación TPM.
- Detalle en [18-distribucion-segura.md](../18-distribucion-segura.md).

## Consecuencias
+ Comprometer la web no compromete el producto; se reduce el riesgo de instaladores falsificados.
− Proceso comercial más lento; no hay versión de prueba de autoservicio.
