# ADR-0012 — TPM 2.0 obligatorio, sin excepciones

**Estado:** Aceptado (ronda 4, decisión del fundador: "sí o sí TPM 2.0")

## Contexto
La app de escritorio (ADR-0009) guarda la clave de cada equipo en hardware. En [17 §17.4.1](../17-aplicacion-escritorio.md#1741-qué-implica-exigir-tpm-20-ejemplo) se analizaron tres opciones: exigir TPM 2.0, permitir un modo degradado o usar una llave FIDO2 externa como excepción.

## Decisión
- **NEXUS CUBE Desktop sólo se instala y se inscribe en equipos con TPM 2.0 activo.** No hay modo degradado ni alternativa con llave USB para sustituir al TPM.
- Plataforma objetivo: **Windows 11**. Un equipo con Windows 10 y TPM 2.0 activo se admite técnicamente; pero, si no recibe actualizaciones de seguridad (sin ESU vigente), se marca como postura no conforme y no recibe claves de compartimentos sensibles.
- La comprobación la hace el **servidor**, no sólo el instalador: la inscripción exige una atestación del TPM (clave de aval/endorsement y clave de atestación), y el servidor la verifica antes de emitir la identidad del equipo. Así, un instalador modificado no puede saltarse el requisito.
- Las máquinas virtuales se admiten sólo con **vTPM** (Hyper-V, VMware, Azure, etc.) y bajo la misma verificación.
- Las llaves FIDO2 siguen siendo obligatorias para administradores y custodios ([06 §6.3](../06-nexus-id.md#63-niveles-de-credencial)), pero **además** del TPM, nunca en su lugar.

## Consecuencias
+ Un único modelo de seguridad: claves no copiables en todos los equipos y atestación de arranque. Más simple de probar y auditar.
+ Coherente con el fin del soporte de Windows 10: los equipos que quedan fuera ya eran un riesgo.
− Algunos clientes deberán activar el fTPM en la BIOS o renovar equipos antes de usar NEXUS → venta más lenta (riesgo R-27).
− Hace falta una **herramienta de diagnóstico previa a la venta** (ver hoja de ruta, Fase 2).

## Alternativas descartadas
- Modo degradado sin TPM: claves copiables desde el disco.
- Llave FIDO2/PIV externa en lugar de TPM: sin atestación de arranque y con más complejidad de soporte.
