# ADR-0005 — Biometría sólo local

**Estado:** Propuesto — revisión legal de privacidad pendiente.

## Contexto
Las plantillas biométricas son datos de categoría especial e irrevocables. Usarlas como claves es inseguro (no son secretas ni exactamente reproducibles).

## Decisión
La biometría sólo desbloquea credenciales FIDO en el autenticador del usuario. El servidor recibe el flag UV firmado. NEXUS no almacena ni procesa plantillas. Verificación documental/prueba de vida, cuando se use, la realiza un proveedor bajo DPIA y NEXUS sólo guarda el resultado.

## Consecuencias
+ Brecha de servidor no expone biometría; menor carga regulatoria.
− No se puede ofrecer "login por huella en cualquier dispositivo" sin registro previo de ese dispositivo.

## Alternativas
Plantillas centralizadas o "fuzzy extractors" para derivar claves (rechazados: riesgo de privacidad y madurez).
