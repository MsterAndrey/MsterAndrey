# 16. Preguntas técnicas que requieren decisión del fundador

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
