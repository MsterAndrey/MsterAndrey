# 3. Arquitectura general

> Estado: borrador de Etapa 2. Ningún componente existe todavía.

## 3.1 Principios arquitectónicos

1. **Zero Trust real**: toda petición (humana o de servicio) se autentica y autoriza individualmente con contexto (identidad, dispositivo, riesgo, recurso, acción).
2. **Compartimentación por tenant y por compartimento**: datos, claves, colas, caches e índices están particionados; las particiones se verifican con pruebas de aislamiento automáticas.
3. **Plano de control ≠ plano de datos**: CORE gestiona políticas y coordinación, pero **no** está en la ruta de descifrado de datos ni posee claves de datos.
4. **Autorización externa a cada módulo**: un Policy Decision Point (PDP) que evalúa políticas CIPHER compiladas. Los módulos son Policy Enforcement Points (PEP).
5. **Todo lo privilegiado deja rastro verificable** en TRUST antes de ejecutarse (registro *write-ahead*).
6. **Separación de deberes por diseño**: ningún rol puede a la vez definir una política, aprobarla y ejecutarla.
7. **Monolito modular primero** y separación en servicios sólo donde el límite de aislamiento lo justifique ([ADR-0001](adr/ADR-0001-monolito-modular-con-servicios-aislados.md)).

## 3.2 Diagrama de componentes

```mermaid
flowchart LR
  subgraph Clientes
    UI["Dashboard web<br/>(React/TS)"]
    AG["Agente de endpoint<br/>(Rust)"]
    SDK["SDK / CLI / API"]
    CUBE["Dispositivo NEXUS CUBE<br/>(opcional)"]
  end

  GW["API Gateway<br/>TLS 1.3 híbrido PQ<br/>DPoP / mTLS<br/>rate limit"]

  subgraph CP["Plano de control"]
    CORE["NEXUS CORE<br/>registro de módulos, políticas,<br/>orquestación, incidentes"]
    PDP["Policy Decision Point<br/>(evaluador CIPHER)"]
    PAP["Policy Admin<br/>(repositorio firmado de políticas)"]
    APPROVE["Servicio de aprobaciones M-de-N"]
  end

  subgraph ID_["NEXUS ID"]
    IDP["IdP: WebAuthn/FIDO2,<br/>OIDC, tokens DPoP"]
    DIR["Directorio: usuarios,<br/>grupos, dispositivos"]
    VC["Emisor/verificador de<br/>credenciales verificables"]
  end

  subgraph DP["Plano de datos"]
    VAULTAPI["VAULT API<br/>(metadatos)"]
    VCRYPTO["VAULT Crypto Worker<br/>(proceso aislado)"]
    OBJ[("Almacenamiento de objetos<br/>con Object Lock / WORM")]
    META[("PostgreSQL por tenant<br/>(RLS + esquemas)")]
  end

  subgraph SEC["Detección y respuesta"]
    SENT["NEXUS SENTINEL<br/>ingesta, correlación, reglas"]
    SOAR["Motor de respuesta<br/>(playbooks CIPHER)"]
    TELE[("Almacén de telemetría")]
  end

  subgraph AI["CIPHER AI"]
    AIGW["AI Gateway<br/>(orquestador + guardas)"]
    LLM["Modelo LLM<br/>(sin acceso directo a datos)"]
    TOOLS["Herramientas tipadas<br/>(sólo vía PEP)"]
  end

  subgraph TR["NEXUS TRUST"]
    LOG["Log de transparencia<br/>(Merkle, append-only)"]
    WIT["Testigos externos"]
  end

  KMS[["HSM / KMS<br/>partición por tenant"]]
  SPIRE[["SPIFFE/SPIRE<br/>identidad de servicios"]]

  UI & SDK --> GW
  AG --> GW
  CUBE --> GW
  GW --> IDP
  GW --> VAULTAPI
  GW --> SENT
  GW --> AIGW
  GW --> CORE

  VAULTAPI --> PDP
  SENT --> PDP
  AIGW --> PDP
  CORE --> PDP
  PAP --> PDP
  APPROVE --> PDP

  VAULTAPI --> VCRYPTO --> KMS
  VCRYPTO --> OBJ
  VAULTAPI --> META

  AIGW --> LLM
  AIGW --> TOOLS --> VAULTAPI
  TOOLS --> SENT

  SENT --> TELE
  SENT --> SOAR --> CORE
  SOAR --> IDP

  VAULTAPI & IDP & CORE & SOAR & AIGW & APPROVE --> LOG
  LOG --> WIT
  SPIRE -. "SVID mTLS" .- CORE & VAULTAPI & VCRYPTO & SENT & AIGW & IDP & LOG
```

## 3.3 Responsabilidades y límites de cada módulo

| Módulo | Hace | No hace (límite explícito) |
|---|---|---|
| **CORE** | Registro de módulos, distribución de políticas firmadas, orquestación de incidentes, gestión de configuración de tenant | No posee claves de datos; no puede leer objetos de VAULT; no puede borrar logs |
| **PDP** | Evalúa políticas CIPHER compiladas; devuelve `permit/deny + obligaciones` | No ejecuta acciones; sin E/S salvo lectura de atributos de un caché firmado |
| **PAP** | Almacena políticas versionadas y firmadas; requiere aprobación M-de-N para publicar | No evalúa |
| **NEXUS ID** | Autenticación de humanos, emisión de tokens DPoP de vida corta, registro de dispositivos, credenciales verificables | No ve biometría; no decide autorización de recursos |
| **VAULT API** | Metadatos, versionado, compartición, cuotas | No ve claves raíz; no descifra (delegado al Crypto Worker) |
| **VAULT Crypto Worker** | Genera DEK, pide desenvoltura al KMS, cifra/descifra en streaming | Sin acceso a red salvo KMS y almacén; proceso aislado por tenant (o pool con aislamiento verificado) |
| **SENTINEL** | Ingesta, normalización (OCSF), detección (reglas CIPHER/Sigma), correlación, alertas | Acciones de respuesta sólo vía playbooks autorizados por PDP |
| **CIPHER AI** | Explicar, correlacionar, resumir, proponer acciones, consultar datos autorizados | Sin credenciales propias; sin ejecución de acciones destructivas sin aprobación humana |
| **TRUST** | Log append-only con pruebas de inclusión/consistencia; checkpoints co-firmados | No interpreta eventos; no puede ser purgado por ningún rol del tenant ni del operador sin dejar evidencia |

## 3.4 Autenticación entre servicios

- Identidad de cada carga de trabajo: **SPIFFE ID** (`spiffe://nexus/<entorno>/<servicio>`) con SVID X.509 de vida ≤ 1 h emitida por SPIRE tras atestación de nodo (TPM o identidad de instancia cloud) y de carga (selector de Kubernetes/imagen firmada).
- Transporte: **mTLS** obligatorio, TLS 1.3 con grupo híbrido.
- Autorización de servicio a servicio: lista de permisos declarada en el manifiesto del servicio y evaluada por el PDP (p. ej. "SENTINEL puede invocar `id.session.revoke`, sólo con un `incident_id` válido").
- Propagación del sujeto humano: token de transacción firmado (RFC 8693, atenuado) para que cada servicio sepa **en nombre de quién** actúa.

## 3.5 Flujos principales (diagramas de secuencia)

### 3.5.1 Lectura de un documento cifrado

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant GW as API Gateway
  participant VA as VAULT API
  participant PDP as PDP (CIPHER)
  participant TR as TRUST
  participant CW as Crypto Worker
  participant KMS as HSM/KMS (tenant)
  participant S3 as Object Store

  U->>GW: GET /vault/objects/{id} (token DPoP + prueba)
  GW->>GW: Verifica token, prueba DPoP, límite de tasa
  GW->>VA: petición + contexto (usuario, dispositivo, riesgo)
  VA->>PDP: ¿permit(read, objeto, sujeto, contexto)?
  PDP-->>VA: permit + obligación "auditar"
  VA->>TR: append(evento lectura, sin contenido)
  TR-->>VA: recibo (índice de hoja)
  VA->>CW: decrypt(objeto, recibo, token de transacción)
  CW->>S3: lee blob cifrado
  CW->>KMS: unwrap(wrapped_dek, contexto) con identidad del worker
  KMS-->>CW: DEK (en memoria, TTL corto)
  CW-->>U: stream descifrado (vía GW)
```

### 3.5.2 Acción administrativa sensible (M-de-N)

```mermaid
sequenceDiagram
  autonumber
  actor A1 as Admin 1
  actor A2 as Admin 2
  participant CORE
  participant APP as Aprobaciones
  participant PDP
  participant TR as TRUST

  A1->>CORE: Solicita "exportar compartimento X" (justificación)
  CORE->>PDP: ¿requiere aprobación?
  PDP-->>CORE: requiere 2-de-3 del grupo "custodios", excluye solicitante
  CORE->>TR: append(solicitud)
  CORE->>APP: crea solicitud con expiración 24 h
  APP-->>A2: notificación
  A2->>APP: aprueba (firma WebAuthn sobre hash de la solicitud)
  APP->>TR: append(aprobación firmada)
  APP->>CORE: quórum alcanzado
  CORE->>PDP: reevalúa con aprobaciones
  PDP-->>CORE: permit (ventana 1 h)
  CORE->>TR: append(ejecución)
```

La aprobación es una **firma WebAuthn sobre el hash de la solicitud** (no un clic), de modo que una sesión secuestrada del dashboard no basta para aprobar.

### 3.5.3 Respuesta automática de SENTINEL

```mermaid
sequenceDiagram
  autonumber
  participant SE as SENTINEL
  participant PB as Playbook (CIPHER)
  participant PDP
  participant ID as NEXUS ID
  participant H as Analista de guardia
  participant TR as TRUST

  SE->>SE: Detección: patrón de cifrado masivo desde sesión S
  SE->>PB: ejecutar playbook "contener_sesion"
  PB->>PDP: ¿permit(id.session.revoke, S)? (acción reversible, impacto bajo)
  PDP-->>PB: permit automático
  PB->>TR: append(acción automática + evidencias)
  PB->>ID: revoke(S)
  PB->>PDP: ¿permit(endpoint.isolate, host)? (impacto alto)
  PDP-->>PB: requiere aprobación humana
  PB->>H: propuesta con evidencias + botón aprobar (WebAuthn)
```

## 3.6 Multi-tenancy

| Capa | Mecanismo de aislamiento | Verificación |
|---|---|---|
| Claves | TRK por tenant en partición de HSM/KMS separada | Prueba: credenciales del worker del tenant A no pueden desenvolver claves de B |
| Datos | Prefijos de almacenamiento por tenant + AAD con `tenant_id` | Prueba de mezcla de blobs entre tenants → fallo de autenticación |
| Metadatos | PostgreSQL: esquema por tenant + Row Level Security como segunda barrera; tenants enterprise/críticos en base dedicada | Pruebas de consulta cruzada en CI |
| Cómputo | Crypto Worker por tenant (enterprise) o pool con proceso efímero por petición | Pruebas de reutilización de memoria |
| Telemetría | Índices por tenant | Consulta cruzada en CI |
| IA | Contexto del modelo construido sólo con datos autorizados del solicitante; sin memoria compartida entre tenants; sin entrenamiento con datos de cliente sin contrato explícito | Pruebas de fuga entre tenants |

Modelos de despliegue: **SaaS multi-tenant**, **SaaS dedicado (single-tenant)**, **on-premises / soberano** (infraestructura crítica), **híbrido** con NEXUS CUBE físico como ancla de claves local.

## 3.7 Puntos únicos de fallo y dependencias críticas

| Componente | ¿SPOF? | Riesgo si falla | Riesgo si se compromete | Mitigación |
|---|---|---|---|---|
| PDP | Disponibilidad: sí | Todo se deniega (fail-closed) | Puede emitir `permit` falsos → **crítico** | Réplicas sin estado; políticas firmadas verificadas por cada PEP; decisiones auditadas; PEPs aplican *deny-overrides* local para invariantes (p. ej. tenant ≠ tenant) |
| HSM/KMS | Sí por tenant | Sin descifrado nuevo (DEK en caché expiran) | Exposición del tenant | Clúster HSM; cuotas y alertas de tasa de unwrap; política de acceso por identidad de worker |
| SPIRE | Sí | Sin nuevas SVIDs (expiran en ≤1 h) | Suplantación de servicios | Clave raíz en HSM; SVIDs cortas; atestación de nodo; servidor anidado por región |
| NEXUS ID | Sí | Nadie inicia sesión | Emisión de tokens falsos | Claves de firma en HSM; tokens cortos ligados a DPoP; *break-glass* offline documentado |
| TRUST | Escritura: sí | Operaciones privilegiadas bloqueadas (write-ahead) | Ocultación de eventos → detectable por testigos | Réplicas; buffer local firmado en caso de caída; testigos externos |
| CORE | Parcial | Sin cambios de política/orquestación; el plano de datos sigue | Distribución de políticas maliciosas → requiere firma M-de-N | CORE no puede firmar políticas por sí solo |
| Proveedor LLM | No (degradable) | Sin asistente de IA | Respuestas manipuladas → no ejecutan nada sin PDP | Modelo autohospedado para tenants críticos |
| Cadena de suministro de software | Sí | — | Backdoor en todos los tenants | SLSA L3, builds reproducibles, firma y verificación en despliegue, revisión de dependencias |

## 3.8 Observabilidad (sin datos sensibles)

- Logs estructurados con **esquema de campos permitidos** (allow-list); el logger rechaza campos no declarados. Prohibidos: tokens, claves, contenido de objetos, plantillas biométricas, prompts completos de IA con datos de cliente (se registran hashes y referencias).
- Métricas (Prometheus/OpenTelemetry) sin etiquetas de alta cardinalidad con PII.
- Trazas con identificadores seudónimos.
- Separación: **logs operativos** (para depurar; retención corta) ≠ **eventos de auditoría** (TRUST; retención larga, integridad verificable).

## 3.9 Despliegue y actualizaciones

- Infraestructura como código revisada (2 aprobadores) y firmada.
- Imágenes de contenedor mínimas (distroless), firmadas con Sigstore; admisión en Kubernetes sólo de imágenes firmadas por la pipeline (política de admisión).
- Despliegue progresivo (canary por región/tenant interno primero) con rollback automático por SLO.
- Actualización de agentes de endpoint y del dispositivo CUBE: paquetes firmados (`NC-SIG-2`/`NC-SIG-3`), anti-rollback por contador monótono, canal de actualización con "staged rollout".

## 3.10 Recuperación

Detallado en [07-nexus-vault.md §Recuperación](07-nexus-vault.md#78-recuperación) y en el plan de pruebas. Objetivos iniciales propuestos (a confirmar por el fundador): RPO ≤ 15 min y RTO ≤ 4 h para metadatos; RPO 0 para objetos versionados (inmutables).
