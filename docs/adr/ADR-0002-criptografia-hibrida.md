# ADR-0002 — Criptografía híbrida clásica + poscuántica

**Estado:** Propuesto — requiere revisión de criptógrafo externo.

## Contexto
Riesgo "harvest now, decrypt later" para datos de larga confidencialidad. Los algoritmos PQC (FIPS 203/204/205) son recientes y sus implementaciones tienen poco historial.

## Decisión
- Intercambio de claves en transporte y envoltura a destinatarios: **X25519 + ML-KEM-768** combinados (la seguridad se mantiene si cualquiera de los dos resiste).
- Firmas de larga vida: **Ed25519 + ML-DSA-65** compuestas (ambas deben verificar). Raíces offline/firmware: **SLH-DSA o LMS**.
- Cifrado simétrico: AES-256 (margen frente a Grover).
- Suites identificadas por `suite_id`; plan de agilidad documentado.

## Consecuencias
+ Protección frente a CRQC futuro sin depender únicamente de algoritmos jóvenes.
− Tamaños mayores (firmas, handshakes), más código, dependencia de bibliotecas PQ con menos auditorías.

## Alternativas
Sólo clásica (rechazado para datos de larga vida); sólo PQC (rechazado: inmadurez de implementaciones).
