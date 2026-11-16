# ADR-0011 — Sector legal: un compartimento por cliente o por caso

**Estado:** Aceptado (ronda 3)

## Contexto
El secreto profesional del abogado (Ley 1123 de 2007 [VERIFICAR]) exige que la información de un cliente no sea accesible para personas que no trabajan en su asunto, ni para el proveedor tecnológico.

## Decisión
- Cada **cliente** de la firma, o cada **caso** cuando la firma lo prefiera, tiene su propio compartimento con su propia clave (Compartment Key).
- **Cifrado de extremo a extremo por defecto** en estos compartimentos: NEXUS (operador) y CIPHER AI no pueden leer el contenido.
- Sólo los miembros asignados al cliente o caso tienen acceso; cambiar a los miembros rota la clave para los datos nuevos (ver [07 §7.2](../07-nexus-vault.md#72-modos-de-cifrado)).
- **Conflicto de intereses:** una política CIPHER puede impedir que una persona pertenezca a la vez a compartimentos de dos clientes marcados como contrarios.
- Recuperación: fragmentos M-de-N entre socios de la firma (ADR-0008); NEXUS puede guardar como máximo un fragmento opcional.
- Retención y supresión configurables por compartimento, con crypto-shredding.

## Consecuencias
+ Un acceso indebido o una brecha afecta a un solo cliente o caso.
+ Prueba técnica del deber de confidencialidad ante clientes y autoridades.
− Sin búsqueda en el servidor ni análisis de la IA sobre el contenido de los expedientes (salvo en el equipo del usuario).
− Más claves que gestionar; la app debe hacerlo transparente.
