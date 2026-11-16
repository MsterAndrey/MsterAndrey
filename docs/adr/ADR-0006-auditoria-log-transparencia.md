# ADR-0006 — Auditoría como log de transparencia con testigos

**Estado:** Propuesto

## Contexto
Los logs deben resistir a administradores maliciosos, incluido el operador.

## Decisión
Log Merkle append-only por tenant (estilo RFC 6962/9162), implementado sobre Tessera/Trillian, con checkpoints firmados (`NC-SIG-2`) y co-firmados por testigos independientes (incluido opcionalmente el cliente). Escritura write-ahead para operaciones privilegiadas. Verificador independiente de código abierto.

## Consecuencias
+ Manipulación detectable criptográficamente; reutiliza tecnología probada.
− La detección requiere que alguien verifique (testigos y clientes); la omisión de eventos sólo se mitiga parcialmente.

## Alternativas
Blockchain (rechazado: complejidad sin beneficio adicional); WORM sin Merkle (rechazado: no da pruebas a terceros).
