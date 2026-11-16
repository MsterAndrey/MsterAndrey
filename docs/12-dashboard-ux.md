# 12. Propuesta visual del dashboard

## 12.1 Principios de diseño

1. **Claridad antes que espectáculo**: sin animaciones de "hackeo", sin mapas mundiales con líneas de ataque decorativas. Cada elemento visual responde a una pregunta operativa.
2. **Sólo datos respaldados por el backend**: cada widget declara su fuente (servicio + endpoint). Si un dato no existe aún, el widget no se muestra (no se rellena con ejemplos en producción).
3. **Estado honesto**: "desconocido" y "sin datos" son estados visibles distintos de "correcto". Nunca verde por defecto.
4. **Acciones peligrosas con fricción proporcional**: confirmación con resumen literal y firma WebAuthn para acciones disruptivas.
5. **Accesibilidad**: WCAG 2.2 AA; el estado nunca se comunica sólo con color (icono + texto); soporte de teclado completo.
6. **Trazabilidad**: cada número enlaza a los eventos que lo componen (drill-down hasta TRUST).

## 12.2 Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--nc-blue` | `#2563EB` | Acción primaria, enlaces, foco |
| `--nc-navy` | `#0F172A` | Fondo modo oscuro, cabeceras |
| `--nc-white` | `#FFFFFF` | Fondo modo claro, texto sobre navy |
| `--nc-slate` | `#64748B` | Texto secundario, bordes |
| `--nc-violet` | `#7C3AED` | Acento: elementos de IA (para distinguir siempre lo generado por IA) |
| `--nc-critical` | `#DC2626` | Riesgo crítico |
| `--nc-high` | `#EA580C` | Riesgo alto |
| `--nc-medium` | `#CA8A04` | Riesgo medio |
| `--nc-ok` | `#16A34A` | Verificado correcto |
| `--nc-unknown` | `#94A3B8` | Sin datos / desconocido |

- Tipografía: Inter (UI) y JetBrains Mono (identificadores, hashes, CIPHER).
- **El cubo**: logotipo isométrico de líneas finas (tres caras visibles = identidad, datos, auditoría). Se usa en logotipo, pantalla de carga y como indicador de estado de integridad de TRUST (cubo completo = log verificado por testigos; cara atenuada = verificación pendiente). No se usa como decoración repetida.
- Modo oscuro por defecto para SOC; modo claro para administración y reportes.

## 12.3 Estructura general

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ▣ NEXUS CUBE   Organización: ACME ▾   Región: EU-1    🔍 Buscar   👤 Ana │
├────────────┬─────────────────────────────────────────────────────────────┤
│ Dashboard  │  Estado de integridad del log: ✔ verificado por 3/3 testigos │
│ Seguridad  │  (checkpoint #48 213, hace 2 min)                            │
│ Amenazas   │ ┌──────────────┬──────────────┬──────────────┬─────────────┐ │
│ Incidentes │ │ Incidentes   │ Alertas sin  │ Cuentas con  │ Aprobaciones│ │
│ Identidades│ │ abiertos     │ triaje       │ AAL < polít. │ pendientes  │ │
│ Biometría  │ │   3 (1 alto) │   17         │   4          │   2         │ │
│ Vault      │ └──────────────┴──────────────┴──────────────┴─────────────┘ │
│ IA         │ Actividad reciente (TRUST)          │ Alertas por severidad   │
│ Criptografía│ 10:42 ana  aprobó export comp-7    │ ■■■ crit 1             │
│ Dispositivos│ 10:40 auto revocó sesión s-91 ↺    │ ■■■■■ alta 5           │
│ Auditoría  │ 10:31 luis publicó política v12     │ …                       │
│ Recuperación│                                     │                         │
│ Reportes   │                                                             │
│ Organizac. │                                                             │
│ Config.    │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```
(Los valores del boceto son ilustrativos del diseño, no datos reales.)

## 12.4 Módulos de interfaz y fuentes de datos

| # | Pantalla | Contenido principal | Fuente backend (debe existir antes de mostrar) |
|---|---|---|---|
| 1 | **Dashboard general** | Incidentes abiertos, alertas sin triaje, aprobaciones pendientes, estado de integridad de TRUST, cobertura de postura de dispositivos, actividad reciente | SENTINEL `/incidents`, `/alerts?state=new`; CORE `/approvals`; TRUST `/checkpoints/latest`; ID `/devices/posture-summary` |
| 2 | **Centro de seguridad** | Postura de configuración del tenant frente a controles recomendados (p. ej. % usuarios con passkey, admins con llave hardware, compartimentos con retención) — cada control con su evidencia | ID, VAULT, CORE (consultas agregadas) |
| 3 | **Centro de amenazas** | Alertas, detecciones activas, mapeo ATT&CK de detecciones **habilitadas** (cobertura declarada, no "protección"), precisión por regla | SENTINEL |
| 4 | **Identidades** | Usuarios, grupos, credenciales por tipo, nivel AAL, últimos accesos, roles JIT activos | ID, PDP |
| 5 | **Gestión biométrica** | **No muestra biometría** (no existe en servidor). Muestra: autenticadores registrados, si soportan UV biométrico (según metadatos FIDO), estado de verificaciones documentales (resultado + proveedor + fecha, sin imágenes) | ID, FIDO MDS |
| 6 | **Almacenamiento seguro** | Compartimentos, modo (gestionado/E2EE/HYOK), retención, versión de KEK, último scrubbing, estado de copia aislada | VAULT |
| 7 | **Inteligencia artificial** | Conversaciones del usuario, acciones propuestas y su estado, herramientas habilitadas por rol, uso | AI Gateway, TRUST |
| 8 | **Administración criptográfica** | Inventario de suites en uso (CBOM), edad de claves, rotaciones programadas, algoritmos en deprecación, estado HSM | CORE (CBOM), KMS |
| 9 | **Gestión de dispositivos** | Dispositivos, postura atestada, revocaciones, agentes; dispositivos CUBE (si existen) | ID, agente |
| 10 | **Auditoría** | Explorador del log de TRUST con filtros, verificación de pruebas de inclusión en el navegador (WASM), descarga de checkpoints | TRUST |
| 11 | **Gestión de incidentes** | Línea temporal, evidencias, acciones (automáticas/propuestas/aprobadas), responsables, plantillas de informe | SENTINEL, SOAR, TRUST |
| 12 | **Configuración empresarial** | Políticas CIPHER (editor con diff semántico), retenciones, integraciones, umbrales | PAP, CORE |
| 13 | **Gestión de organizaciones** | Tenants/sub-organizaciones (para MSPs), regiones, modo de despliegue | CORE |
| 14 | **Reportes** | Informes de incidentes, accesos, cambios de permisos, recuperación probada; exportables con hash y prueba de inclusión | Todas, vía TRUST |
| 15 | **Centro de recuperación** | Restauraciones por punto en el tiempo, estado de custodios y última verificación de shares, último simulacro y resultado | VAULT, CORE |

## 12.5 Indicadores **prohibidos** (por no ser respaldables)

- "Puntuación de seguridad 98/100" sin metodología pública.
- "Amenazas bloqueadas" sin definición verificable.
- "Protección cuántica: activa" (se muestra en cambio: "Suites en uso: X25519MLKEM768 en 100 % del tráfico TLS medido").
- Mapas de ataques globales en tiempo real decorativos.

## 12.6 Patrones de interacción críticos

- **Aprobación**: tarjeta con resumen legible + JSON canónico desplegable + hash; botón "Aprobar con llave de seguridad".
- **Contenido de IA**: borde violeta, etiqueta "Generado por IA", enlaces a evidencia; nunca mezclado sin marcar con datos del sistema.
- **Acciones automáticas**: icono ↺ indica reversible con botón "Revertir".
- **Estados**: correcto (verde + ✔), advertencia, crítico, **desconocido** (gris + "?" + motivo).

## 12.7 Implementación prevista

React + TypeScript, componentes accesibles (p. ej. Radix UI), CSP estricta sin `unsafe-inline`, Trusted Types, sin scripts de terceros en el dashboard, verificador de pruebas de TRUST compilado a WASM desde la misma base Rust.
