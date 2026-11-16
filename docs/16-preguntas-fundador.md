# 16. Preguntas técnicas que requieren decisión del fundador

## Respuestas recibidas — ronda 1

| # | Respuesta del fundador | Cómo se incorporó |
|---|---|---|
| Q1 | Empresas | Segmento empresarial; planes en [19](19-modelo-negocio.md). Tamaño acotado en la ronda 2: 100–1 000 empleados |
| Q2 | Colombia y después a nivel mundial | Marco normativo en [20](20-marco-colombia.md); expansión en §20.4 |
| Q4 | Complementa, pero si es posible que sustituya | Fase 2–3: integrar (IdP, EDR). Sustitución progresiva por módulo cuando haya evidencia de calidad comparable |
| Q8 | Sí, recuperación mediante la IA con las llaves de la persona | **Conflicto con las reglas 4 y 6.** Alternativa propuesta: la IA guía y la app usa la llave tras confirmación biométrica; el operador sólo guarda un fragmento opcional. Ver [ADR-0008](adr/ADR-0008-recuperacion-asistida-por-ia.md). **Confirmado en la ronda 2** |
| — | El sistema se instala en el computador | [ADR-0009](adr/ADR-0009-local-first-aplicacion-escritorio.md), [17](17-aplicacion-escritorio.md) |
| — | Web sólo de presentación, sin conexión, descarga por correo con pasos estrictos | [ADR-0010](adr/ADR-0010-web-independiente-distribucion-controlada.md), [18](18-distribucion-segura.md) |
| — | Modelos de pago mundiales para empresas | [19](19-modelo-negocio.md) |

## Respuestas recibidas — ronda 2

| # | Respuesta | Cómo se incorporó |
|---|---|---|
| P-D2 | La IA sólo guía; no usa las llaves | [ADR-0008](adr/ADR-0008-recuperacion-asistida-por-ia.md) aceptado; riesgo R-23 mitigado |
| P-D3 | Empresas de 100 a 1 000 empleados | Plan **Profesional** como oferta principal del piloto ([19](19-modelo-negocio.md)) |
| P-D7 | Sectores legal y salud | Requisitos sectoriales en [20 §20.3](20-marco-colombia.md#203-sectores-prioritarios-legal-y-salud); pilotos con firmas de abogados e IPS medianas |

Pendientes de la ronda 2: P-D1 (equipos sin TPM), P-D4 (sistema operativo inicial), P-D5 (servidor gestionado u on-premise), P-D6 (sólo lectura si no se paga).

## Preguntas de la ronda 2

| # | Pregunta | Recomendación |
|---|---|---|
| P-D1 | ¿Se admiten equipos sin TPM 2.0? | No para datos sensibles; modo degradado señalado para el resto |
| P-D2 | ¿Aceptas la alternativa del ADR-0008 (la IA guía, pero no usa las claves)? | Sí |
| P-D3 | ¿Tamaño de las primeras empresas en Colombia? (10–100, 100–1 000, 1 000+) | Medianas (100–1 000): pueden pagar y tienen procesos, sin ciclos de venta de un año |
| P-D4 | ¿Sistema operativo inicial? | Windows 10/11 |
| P-D5 | ¿NEXUS Server gestionado por NEXUS, on-premise, o ambos desde el inicio? | Gestionado primero (con región compatible); on-premise para el plan Empresarial |
| P-D6 | ¿Aceptas que, si no se paga la licencia, el cliente conserve el acceso de sólo lectura a sus datos? | Sí (ver §19.1) |
| P-D7 | ¿Sector prioritario en Colombia? (financiero, salud, legal, manufactura, gobierno) | Legal y salud medianas: datos sensibles, menor barrera regulatoria que el sector financiero |

## Preguntas originales

Ordenadas por impacto en la arquitectura. Cada una indica la recomendación del equipo y qué bloquea.

## Producto y mercado

| # | Pregunta | Opciones | Recomendación | Bloquea |
|---|---|---|---|---|
| Q1 | ¿Cuál es el **primer segmento** de clientes? | PYMEs / medianas reguladas / corporaciones / infraestructura crítica | Medianas empresas reguladas en un país/región concreto | Requisitos de despliegue, cumplimiento, priorización |
| Q2 | ¿**Jurisdicciones** iniciales? | UE, EE. UU., LATAM (¿qué países?) | Una sola para el piloto | Residencia de datos, biometría, exportación de cripto |
| Q3 | ¿Modelo de **despliegue** inicial? | SaaS multi-tenant / SaaS dedicado / on-prem | SaaS multi-tenant con opción dedicada | Infraestructura Fase 2 |
| Q4 | ¿NEXUS CUBE **reemplaza** o **complementa** IdP/backup/SIEM existentes del cliente? | Reemplazo / integración | Integración primero (federar con IdP del cliente, ingerir su EDR) | Alcance de ID y SENTINEL |
| Q5 | ¿Es el **hardware** parte de la propuesta comercial inicial? | Sí / Fase 4 | Fase 4; usar HSM/llaves FIDO comerciales antes | Presupuesto, equipo |

## Seguridad y criptografía

| # | Pregunta | Recomendación | Bloquea |
|---|---|---|---|
| Q6 | ¿Se necesita **validación FIPS 140-3** (clientes gobierno EE. UU. / sector financiero)? | Diseñar para poder usar módulos validados (AWS-LC FIPS, HSM certificados) sin comprometerse aún a validar el propio | Elección de bibliotecas |
| Q7 | ¿Aceptan que en modo **E2EE** se pierdan funciones (búsqueda, IA sobre contenido, DLP) y que la pérdida de shares implique **pérdida irrecuperable**? | Sí, opcional por compartimento | Diseño de VAULT |
| Q8 | ¿El **operador NEXUS** debe poder ayudar a recuperar datos de un cliente que perdió todo acceso? (Implica algún tipo de custodia por el operador) | No por defecto; ofrecer custodia de un share como servicio opcional y explícito | Regla "sin clave maestra" |
| Q9 | ¿Retención mínima por defecto de versiones inmutables? | 30 días configurable hasta años | Coste de almacenamiento, anti-ransomware |
| Q10 | ¿Quiénes serán los **testigos externos** de TRUST? | Cliente (CUBE o servicio), un tercero independiente, un segundo proveedor cloud | Fase 2 |

## Identidad y biometría

| # | Pregunta | Recomendación | Bloquea |
|---|---|---|---|
| Q11 | ¿Se requiere **verificación documental / prueba de vida** en v1? | No en v1; sólo para recuperación en Fase 3 con proveedor evaluado | Proveedor, DPIA |
| Q12 | ¿Algún cliente exige **biometría centralizada** (p. ej. control de acceso físico)? | Rechazar en v1; si aparece, evaluación de privacidad dedicada y producto separado | Regla innegociable 2 |
| Q13 | ¿Se aceptan **passkeys sincronizadas** para usuarios estándar? | Sí (mejor UX), con passkeys ligadas a dispositivo para roles elevados | Política de ID |

## IA

| # | Pregunta | Recomendación | Bloquea |
|---|---|---|---|
| Q14 | ¿Proveedor de LLM externo o modelo autohospedado? | Externo con no retención para piloto; autohospedado para clientes críticos | Fase 3 |
| Q15 | ¿Se permite usar datos de clientes para **mejorar modelos**? | No, salvo acuerdo explícito, opt-in y anonimización revisada | Contratos |

## CIPHER

| # | Pregunta | Recomendación | Bloquea |
|---|---|---|---|
| Q16 | ¿CIPHER será **código abierto**? | Abrir especificación, evaluador de referencia y verificador TRUST (genera confianza y revisión externa); el resto según estrategia | Licencias, comunidad |
| Q17 | ¿Aceptan que CIPHER **no** sea de propósito general (sin E/S, sin bucles libres)? | Sí — es la base de su seguridad | Diseño del lenguaje |

## Organización

| # | Pregunta | Bloquea |
|---|---|---|
| Q18 | Presupuesto disponible para Fases 0–2 y para auditorías externas | Ritmo de la hoja de ruta |
| Q19 | ¿Equipo existente? Lenguajes dominantes (decide Go vs. Rust en servicios) | Tecnologías |
| Q20 | Objetivos de **RPO/RTO** comprometibles con clientes | Arquitectura de recuperación |
| Q21 | ¿Quién ejerce de **responsable de seguridad** con autoridad para bloquear releases? | Gobierno del proyecto |
