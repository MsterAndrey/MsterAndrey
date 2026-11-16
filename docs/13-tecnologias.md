# 13. Tecnologías recomendadas y justificación

Criterios: **S** seguridad, **R** rendimiento, **M** mantenibilidad, **O** complejidad operacional, **T** disponibilidad de talento.

## 13.1 Lenguajes

| Componente | Elección | Justificación | Alternativa descartada y por qué |
|---|---|---|---|
| VAULT Crypto Worker, evaluador CIPHER (PDP), TRUST, agente de endpoint, verificador WASM, firmware CUBE (espacio de usuario) | **Rust** | S: seguridad de memoria sin GC, control de zeroización, `#![forbid(unsafe_code)]` auditable; R: latencia predecible; un mismo código compila a WASM para el navegador | C/C++: riesgo de memoria; Go: menos control sobre memoria de secretos y binarios mayores para WASM |
| API Gateway, VAULT API, CORE, ID, SENTINEL ingest, AI Gateway | **Go** (o Rust si el equipo es mayoritariamente Rust) | S: memory-safe, librería estándar criptográfica sólida (incluye ML-KEM); M/T: productividad y talento abundante; O: binarios estáticos | Java/Kotlin: válido pero mayor superficie de runtime; Node: ecosistema de dependencias más arriesgado para backend crítico |
| Investigación, analítica, modelos de anomalía, evaluaciones de IA | **Python** | T y ecosistema científico; **no** en la ruta crítica de autorización ni de cifrado | — |
| Dashboard | **React + TypeScript** | T, ecosistema de componentes accesibles, tipado | — |

> Decisión pendiente del fundador: **Go vs. Rust para servicios** según el equipo que se pueda contratar. Recomendación: Rust para los 4 componentes críticos listados y Go para el resto.

## 13.2 Datos

| Uso | Elección | Justificación |
|---|---|---|
| Metadatos, configuración, directorio | **PostgreSQL** | Madurez, RLS como segunda barrera multi-tenant, transacciones, réplicas; cifrado de disco + cifrado a nivel de campo para atributos sensibles |
| Objetos | **S3-compatible con Object Lock** (AWS S3, o MinIO/Ceph RGW on-prem) | Inmutabilidad WORM de grado de cumplimiento, durabilidad, versionado nativo |
| Telemetría | **ClickHouse** u OpenSearch (decidir con pruebas de carga) | Consultas analíticas sobre grandes volúmenes; ClickHouse con mejor coste por evento [a validar] |
| Log de transparencia | **Tessera/Trillian** sobre PostgreSQL o almacenamiento de objetos | Implementaciones probadas en CT/Sigstore; evita reinventar el árbol de Merkle |
| Colas / bus | **NATS JetStream** (o Kafka a gran escala) | NATS: operación simple, mTLS, cuentas por tenant; Kafka sólo si la escala lo exige |
| Caché | Redis/Valkey **sin datos sensibles** | Sólo rate limiting y caché de decisiones no sensibles |

## 13.3 Seguridad e identidad de infraestructura

| Función | Elección |
|---|---|
| Identidad de servicios | SPIFFE/SPIRE |
| Claves | HSM de red FIPS 140-3 L3 o Cloud HSM/KMS; PKCS#11/KMIP como interfaz |
| Secretos de infraestructura | OpenBao (fork abierto de Vault) o el KMS del cloud; nunca secretos en repositorio |
| Firma de artefactos | Sigstore (cosign) + Rekor |
| Admisión en Kubernetes | Kyverno o policy-controller de Sigstore (sólo imágenes firmadas) |
| WebAuthn servidor | Biblioteca madura (p. ej. `webauthn-rs` o `go-webauthn`) — evaluar auditorías |

## 13.4 Plataforma y despliegue

| Etapa | Elección | Por qué |
|---|---|---|
| Fases 0–1 (prototipo) | Docker Compose local, sin Kubernetes | Kubernetes añade superficie y operación innecesaria para un componente |
| Fase 2 (piloto) | Kubernetes gestionado (EKS/GKE/AKS) o Nomad | Necesario al haber varios servicios aislados, autoscaling y despliegues progresivos |
| On-prem / soberano | Kubernetes distribución endurecida (p. ej. Talos o RKE2 con perfil CIS) | Inmutabilidad del SO del nodo |
| IaC | OpenTofu/Terraform + revisiones obligatorias | Reproducibilidad y auditoría de cambios |
| CI/CD | Runners efímeros, builds herméticos (Bazel o Nix para componentes críticos, a evaluar) | SLSA L3 |
| Observabilidad | OpenTelemetry + Prometheus + Grafana + Loki con esquema de campos permitidos | Estándar abierto |

## 13.5 IA

| Elemento | Elección |
|---|---|
| Orquestación | Código propio pequeño en el AI Gateway (evitar frameworks de agentes con demasiada "magia" y dependencias) |
| Modelo | Abstracción de proveedor; API comercial con acuerdo de no retención o modelo de pesos abiertos autohospedado |
| Evaluación | Suite propia + corpus de inyección públicos; versionado de prompts y datasets |

## 13.6 Tecnologías descartadas (por ahora)

- **Blockchain** para auditoría: un log de transparencia con testigos da las mismas garantías de detección de manipulación con mucha menor complejidad y coste.
- **Criptografía homomórfica** para búsquedas: inmadura en rendimiento para el caso de uso; investigar en Fase 4.
- **Microservicios desde el día 1**: complejidad operativa sin beneficio de aislamiento claro (ADR-0001).
