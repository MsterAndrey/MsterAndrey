# ADR-0007 — Sin clave maestra ni administrador universal

**Estado:** Propuesto

## Contexto
Reglas innegociables 5 y 6. Las "god keys" y los superadministradores son la causa raíz de muchos incidentes masivos.

## Decisión
- Una Tenant Root Key por tenant, en partición separada de HSM/KMS; no existe clave por encima.
- Roles administrativos separados (identidad, políticas, datos, auditoría, recuperación); ningún rol incluye lectura de datos por defecto.
- Acciones sensibles (exportar, purgar, cambiar retención, publicar política, acceso del operador a producción) requieren M-de-N con exclusión del solicitante y firma WebAuthn.
- *Break-glass* existe, pero es M-de-N, con credenciales selladas offline, y genera alerta a todos los custodios y entrada en TRUST.

## Consecuencias
+ Ninguna persona o clave sola compromete todo.
− Más fricción operativa; riesgo de bloqueo si no hay custodios disponibles → procedimientos y custodios suplentes.

## Alternativas
Admin global con auditoría posterior (rechazado: la auditoría no previene).
