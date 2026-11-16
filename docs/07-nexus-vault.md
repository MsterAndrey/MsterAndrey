# 7. NEXUS VAULT — Diseño preliminar

## 7.1 Objetivos

1. Confidencialidad por tenant y por compartimento, con límites de exposición demostrables ante compromiso parcial.
2. Integridad y vinculación de contexto de cada objeto y versión.
3. Resistencia a ransomware y a borrado malicioso, incluso con credenciales administrativas del tenant.
4. Recuperación verificada y probada periódicamente.
5. Gestión de secretos (API keys, certificados, credenciales de servicio) con el mismo modelo de claves.

## 7.2 Modos de cifrado

| Modo | Quién puede descifrar | Funciones del servidor | Casos de uso |
|---|---|---|---|
| **Gestionado por servidor** (por defecto) | Crypto Worker con autorización del PDP | Búsqueda en metadatos, previsualización, escaneo antimalware, DLP | Mayoría de documentos empresariales |
| **E2EE** (extremo a extremo) | Sólo dispositivos de miembros del compartimento | Sólo almacenamiento y versionado; sin escaneo de contenido | Secretos de dirección, M&A, datos legales, claves |
| **HYOK** | Requiere el KMS del cliente en cada desenvoltura | Como "gestionado", pero el cliente puede cortar el acceso | Infraestructura crítica, sector público |

El modo E2EE elimina funciones (búsqueda, DLP, IA sobre contenido). Es un **conflicto funcionalidad/seguridad documentado**: lo decide el cliente por compartimento.

### E2EE: grupos de miembros
- Cada dispositivo miembro tiene un par de claves KEM híbrido (X25519 + ML-KEM-768).
- La Compartment Key (CK) se envuelve con HPKE para cada dispositivo (`NC-WRAP-2`).
- Cambios de miembros → rotación de CK (forward secrecy de membresía para datos nuevos). Para grupos grandes y dinámicos, evaluar MLS (RFC 9420) como gestor de claves de grupo en Fase 3.
- Riesgo principal: **el servidor distribuye las claves públicas** → un servidor malicioso podría inyectar un dispositivo. Mitigación: directorio de claves en log de transparencia (TRUST) + verificación de huellas de seguridad por los miembros (como "key transparency").

## 7.3 Envoltura de claves

Ver jerarquía en [especificación criptográfica §2.3](02-especificacion-criptografica.md#23-jerarquía-de-claves-sin-clave-maestra-universal).

```mermaid
sequenceDiagram
  autonumber
  participant VA as VAULT API
  participant CW as Crypto Worker
  participant KMS as HSM/KMS
  participant OS as Object Store

  VA->>CW: put(object_id, version, stream, recibo TRUST)
  CW->>CW: DEK = random(256); nonce = random(96)
  CW->>CW: ct = AES-256-GCM(DEK, nonce, data, AAD(tenant, comp, obj, ver))
  CW->>KMS: wrap(DEK, KEK_comp, contexto)
  KMS-->>CW: wrapped_DEK
  CW->>OS: PUT blob(header+ct) con Object Lock
  CW->>CW: zeroize(DEK)
  CW-->>VA: hash(ct), tamaño, kek_version
```

Para objetos grandes: cifrado por bloques (chunks) con nonce derivado del índice de bloque y bloque final marcado (esquema tipo STREAM / "online AE") para evitar truncamiento y reordenamiento. [VALIDACIÓN EXTERNA: elegir construcción estándar, p. ej. la de Tink "Streaming AEAD"].

## 7.4 Versionado e inmutabilidad

- Toda escritura crea una versión nueva; nunca se sobrescribe.
- Almacenamiento con **Object Lock en modo compliance** (S3 o equivalente on-prem como MinIO con WORM) durante el periodo de retención del compartimento: ni el operador ni el tenant pueden borrar antes de que expire.
- Borrado lógico inmediato (oculto para usuarios) ≠ purga física (tras retención).
- **Purga anticipada** (p. ej. derecho de supresión GDPR): crypto-shredding — destruir la DEK del objeto (requiere M-de-N y queda en TRUST). Conflicto inmutabilidad vs. derecho de supresión → **resuelto por crypto-shredding**, documentado en ADR futuro.

## 7.5 Protección contra ransomware

| Capa | Control |
|---|---|
| Prevención | Ningún rol puede reducir la retención ni desactivar el versionado sin M-de-N + periodo de espera (p. ej. 72 h) |
| Prevención | Copias de seguridad en cuenta/región separada, con credenciales que no existen en la cuenta principal (sólo un replicador con permiso *put*, sin *delete*) |
| Detección | Métricas por sesión: tasa de nuevas versiones, entropía estimada del contenido (si modo gestionado), cambio de tipo MIME, objetos canario |
| Contención automática | Congelamiento del compartimento (sólo lectura) + revocación de la sesión origen. Acción reversible → permitida sin aprobación humana |
| Recuperación | Restauración de compartimento a un instante T (selección de versiones ≤ T) |

## 7.6 Verificación de integridad

- AEAD por objeto (integridad del contenido y del contexto).
- Manifiesto por compartimento: árbol de Merkle de `(object_id, version, hash(ct))` cuyo raíz se publica periódicamente en TRUST → detecta borrado o sustitución de versiones fuera de la API.
- *Scrubbing* periódico: lectura y verificación de tags de una muestra (y del 100 % en ciclo largo).

## 7.7 Gestión de secretos

- Tipos: secretos estáticos, credenciales dinámicas (p. ej. usuario de BD de vida corta), certificados.
- Entrega a cargas de trabajo sólo vía identidad SPIFFE + política; nunca por variable de entorno de larga vida en IaC.
- Lectura de secretos registrada en TRUST; leasing con expiración.
- Integración posible con OpenBao/HashiCorp Vault existente del cliente en lugar de reemplazarlo (decisión del fundador).

## 7.8 Recuperación

| Escenario | Procedimiento | Requisitos |
|---|---|---|
| Borrado/cifrado por usuario o ransomware | Restaurar versiones previas | Rol "restaurador" + registro en TRUST |
| Pérdida de región | Failover a réplica regional (metadatos con replicación; objetos replicados) | RPO/RTO definidos por plan |
| Compromiso de KEK | Rotación + re-envoltura | Ceremonia documentada |
| Pérdida de acceso al HSM (desastre) | Restauración de TRK desde backup cifrado del HSM (funcionalidad del fabricante) o desde shares de recuperación del cliente | Quórum M-de-N de custodios del cliente |
| E2EE: todos los dispositivos perdidos | Shares de recuperación del compartimento (Shamir, custodios del cliente) | Sin shares ⇒ **pérdida irrecuperable, por diseño**. Debe comunicarse claramente al cliente |

**Pruebas de recuperación trimestrales obligatorias** con evidencia registrada (ver plan de pruebas). Una copia no probada no cuenta como copia.

## 7.9 Límites de exposición ante compromiso parcial

| Componente comprometido | Exposición máxima esperada (a demostrar) |
|---|---|
| Almacenamiento de objetos (lectura) | Ninguna (sólo texto cifrado) |
| Almacenamiento de objetos (escritura) | Denegación/borrado bloqueado por Object Lock; manipulación detectada por AEAD y manifiesto |
| Base de metadatos | Nombres de objetos y estructura (→ cifrar nombres en compartimentos sensibles) |
| VAULT API | Puede solicitar descifrados sólo con decisión del PDP y recibo TRUST → detectable |
| Un Crypto Worker | DEKs en memoria durante TTL + capacidad de unwrap hasta revocación (con límite de tasa) para **un** tenant/pool |
| Una cuenta de usuario | Objetos que ese usuario puede leer, con límite de tasa y detección |
| Admin del tenant | No lee datos por defecto; exportación requiere M-de-N |

## 7.10 API (borrador)

```
POST   /v1/compartments                         crear compartimento (modo, retención)
GET    /v1/compartments/{cid}/objects           listar (paginado, filtrado por PDP)
PUT    /v1/compartments/{cid}/objects/{oid}     nueva versión (streaming)
GET    /v1/compartments/{cid}/objects/{oid}?version=N
DELETE /v1/compartments/{cid}/objects/{oid}     borrado lógico
POST   /v1/compartments/{cid}/restore           {point_in_time} → requiere rol restaurador
POST   /v1/compartments/{cid}/freeze            contención
POST   /v1/compartments/{cid}/export            → crea solicitud M-de-N
GET    /v1/compartments/{cid}/manifest          raíz Merkle + prueba de inclusión
```
Todas las respuestas incluyen `audit_receipt` (índice de hoja en TRUST).
