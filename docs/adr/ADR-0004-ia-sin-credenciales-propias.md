# ADR-0004 — CIPHER AI sin credenciales propias

**Estado:** Propuesto

## Contexto
La inyección de prompt no tiene defensa completa conocida. Un agente con credenciales propias amplias es un "confused deputy".

## Decisión
El AI Gateway no posee permisos de datos. Cada sesión usa un token derivado del usuario por Token Exchange (RFC 8693), con alcance ⊆ usuario, TTL ≤ 5 min. Todas las herramientas pasan por el PDP con `actor=ai, on_behalf_of=user`. Acciones con efecto requieren firma WebAuthn del humano sobre la acción literal. La IA no puede aprobar, publicar políticas ni modificar permisos.

## Consecuencias
+ El peor caso de manipulación queda acotado a "lo que el usuario podría hacer, menos las acciones con efecto".
− Menor autonomía; más fricción en respuesta.

## Alternativas
Cuenta de servicio de IA con permisos amplios (rechazado).
