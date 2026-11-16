# ADR-0001 — Monolito modular con servicios aislados donde el límite de seguridad lo exige

**Estado:** Propuesto

## Contexto
Siete módulos con equipos pequeños. Microservicios completos multiplican superficie de red, autenticación entre servicios, despliegues y fallos parciales. Pero algunos componentes manejan claves o deciden autorización y se benefician de aislamiento de proceso y de identidad.

## Decisión
- Servicios **separados** (proceso, identidad SPIFFE, permisos IAM propios): VAULT Crypto Worker, PDP, NEXUS ID (emisión de tokens), TRUST, AI Gateway.
- El resto (CORE, VAULT API, SENTINEL ingest, APIs del dashboard) empieza como **monolito modular** con fronteras de módulo explícitas (interfaces internas tipadas) que permitan separarlos después.

## Consecuencias
+ Menor complejidad operativa inicial; aislamiento donde importa.
− Un fallo de memoria/lógica en el monolito afecta a varios módulos no críticos → mitigado por lenguaje memory-safe y porque el monolito no posee claves ni decide autorización.

## Alternativas
Microservicios completos (rechazado por coste operativo); monolito total (rechazado: mezclaría claves y autorización con código de negocio).
