# NEXUS CUBE

> *Security must be engineered, not promised.*

NEXUS CUBE es una propuesta de **infraestructura de seguridad empresarial**: identidad verificable, almacenamiento cifrado y compartimentado, un lenguaje de políticas/operaciones de seguridad (CIPHER), un asistente de IA con autorización externa, detección y respuesta, y un registro de auditoría con integridad verificable.

## Estado del proyecto

| Etapa | Estado |
|---|---|
| 1 — Investigación | **Borrador inicial** (este repositorio) |
| 2 — Arquitectura | **Borrador inicial** (este repositorio) |
| 3 — Revisión adversarial | **Parcial**: modelo de amenazas y registro de riesgos iniciales; falta revisión externa |
| 4 — Prototipo | No iniciado |
| 5 — Validación | No iniciado |
| 6 — Integración | No iniciado |

**No existe todavía código del producto, ni pruebas ejecutadas, ni auditorías, ni certificaciones.** Todo lo descrito es diseño propuesto y debe ser revisado por especialistas independientes antes de implementarse. Cualquier afirmación de este repositorio que suene a capacidad existente es un error y debe reportarse.

## Índice de documentación

| # | Documento | Contenido |
|---|---|---|
| 0 | [Resumen ejecutivo](docs/00-resumen-ejecutivo.md) | Visión, alcance, propiedades de seguridad objetivo, no-objetivos |
| 1 | [Investigación tecnológica](docs/01-investigacion-tecnologica.md) | Estándares, madurez (probado / experimental / original), estado del arte |
| 2 | [Especificación criptográfica preliminar](docs/02-especificacion-criptografica.md) | Primitivas, usos, jerarquía de claves, agilidad criptográfica |
| 3 | [Arquitectura general](docs/03-arquitectura-general.md) | Módulos, diagrama de componentes, flujos, puntos únicos de fallo |
| 4 | [Modelo de amenazas inicial](docs/04-modelo-amenazas.md) | STRIDE por módulo, ATT&CK, 14 escenarios con controles y pruebas |
| 5 | [Registro de riesgos](docs/05-registro-riesgos.md) | Riesgos técnicos, de proyecto, regulatorios y de negocio |
| 6 | [NEXUS ID](docs/06-nexus-id.md) | Identidad, passkeys, biometría local, recuperación, revocación |
| 7 | [NEXUS VAULT](docs/07-nexus-vault.md) | Cifrado por tenant, envoltura de claves, versionado, anti-ransomware |
| 8 | [CIPHER (lenguaje)](docs/08-cipher-lenguaje.md) | Filosofía, sintaxis, gramática, tipos, capacidades, compilador |
| 9 | [CIPHER AI](docs/09-cipher-ai.md) | Arquitectura de IA con autorización externa y defensa contra inyección |
| 10 | [SENTINEL y TRUST](docs/10-sentinel-trust.md) | Detección/respuesta con salvaguardas; auditoría verificable |
| 11 | [Hardware NEXUS CUBE](docs/11-hardware.md) | Dispositivo físico: concepto vs. diseño fabricable |
| 12 | [Propuesta visual del dashboard](docs/12-dashboard-ux.md) | Identidad visual, 15 módulos de interfaz, fuentes de datos reales |
| 13 | [Tecnologías recomendadas](docs/13-tecnologias.md) | Selección y justificación por criterio |
| 14 | [Hoja de ruta y estimación](docs/14-hoja-de-ruta.md) | Fases, complejidad, recursos, dependencias |
| 15 | [Plan de pruebas](docs/15-plan-pruebas.md) | Tipos de prueba y criterios objetivos de aprobación/rechazo |
| 16 | [Preguntas para el fundador](docs/16-preguntas-fundador.md) | Decisiones que bloquean el avance |
| 17 | [NEXUS CUBE Desktop](docs/17-aplicacion-escritorio.md) | Aplicación instalada local-first, capas de cifrado, claves en TPM |
| 18 | [Web y distribución segura](docs/18-distribucion-segura.md) | Web independiente; proceso estricto de solicitud y descarga |
| 19 | [Modelos de pago](docs/19-modelo-negocio.md) | Planes, complementos, canales, facturación (hipótesis) |
| 20 | [Marco normativo Colombia](docs/20-marco-colombia.md) | Ley 1581, SIC, SFC, delitos informáticos (requiere abogado) |
| — | [ADR](docs/adr/) | Registros de decisiones de arquitectura |

## Sitio web

La carpeta [`web/`](web/) contiene el sitio de presentación de NEXUS CUBE, el sistema de marca (logotipos SVG) y una demostración de la interfaz de CIPHER AI con datos ficticios. Es independiente del sistema. Instrucciones en [web/README.md](web/README.md).

## Reglas innegociables

Las reglas del proyecto (sin criptografía propia, sin claves maestras universales, sin administrador omnipotente, sin biometría como clave, IA sin autoautorización, etc.) están recogidas en el [resumen ejecutivo](docs/00-resumen-ejecutivo.md#reglas-innegociables) y se trazan a controles concretos en el [modelo de amenazas](docs/04-modelo-amenazas.md).

## Convenciones de este repositorio

- **[PROBADO]**: tecnología estandarizada y desplegada a escala, con historial de análisis público.
- **[EXPERIMENTAL]**: estandarizada recientemente o en borrador; poco historial operativo.
- **[ORIGINAL]**: propuesta de NEXUS CUBE; requiere validación propia.
- **[VALIDACIÓN EXTERNA]**: requiere criptógrafo, abogado, auditor o laboratorio independiente.
- **[VERIFICAR]**: dato que puede haber cambiado; confirmar contra la fuente primaria antes de usar.
