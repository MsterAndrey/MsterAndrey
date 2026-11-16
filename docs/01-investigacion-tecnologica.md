# 1. Investigación tecnológica

> Estado del conocimiento a la fecha de redacción. Los estándares evolucionan: todo lo marcado **[VERIFICAR]** debe confirmarse contra la fuente primaria (NIST CSRC, IETF Datatracker, W3C, FIDO Alliance) antes de tomar decisiones de implementación.

Clasificación usada:
- **[PROBADO]** estándar con despliegue amplio y años de criptoanálisis/uso.
- **[EXPERIMENTAL]** estándar reciente, borrador, o con poca experiencia operativa.
- **[ORIGINAL]** composición propia de NEXUS CUBE (nunca primitivas propias).

---

## 1.1 Criptografía simétrica y AEAD

| Tecnología | Referencia | Madurez | Uso en NEXUS CUBE | Riesgos |
|---|---|---|---|---|
| AES-256-GCM | FIPS 197, NIST SP 800-38D | [PROBADO] | Cifrado de datos en reposo en entornos con AES-NI / HSM; requisito habitual en sectores regulados | Reutilización de nonce = pérdida catastrófica de confidencialidad e integridad. Límite de ~2³² mensajes por clave con nonces aleatorios de 96 bits. Se mitiga con claves derivadas por objeto y nonces aleatorios con contador de uso |
| ChaCha20-Poly1305 | RFC 8439 | [PROBADO] | Clientes móviles/IoT sin aceleración AES; transporte | Mismo problema de reutilización de nonce; preferir XChaCha20-Poly1305 (nonce de 192 bits) [EXPERIMENTAL: sólo borrador IETF, pero ampliamente implementado en libsodium] cuando los nonces sean aleatorios |
| AES-GCM-SIV | RFC 8452 | [PROBADO] | Candidato para envoltura de claves (resistencia a mal uso de nonce) | Menor soporte en HSMs; no está en FIPS 140 como modo aprobado [VERIFICAR] |
| AES Key Wrap (KW/KWP) | NIST SP 800-38F, RFC 3394/5649 | [PROBADO] | Envoltura de claves dentro de HSM | Determinista: no ocultar igualdad de claves envueltas (aceptable para claves aleatorias) |
| HKDF | RFC 5869, SP 800-56C | [PROBADO] | Derivación de claves por contexto | Usar `info` con contexto completo para separación de dominios |

**Conclusión:** AES-256-GCM como predeterminado en servidor (compatibilidad con HSM/FIPS); ChaCha20-Poly1305 en clientes sin aceleración. Ninguno de los dos "garantiza" seguridad: la gestión de nonces, claves y contexto es donde fallan los sistemas reales.

## 1.2 Criptografía asimétrica clásica

| Tecnología | Referencia | Madurez | Uso | Riesgos |
|---|---|---|---|---|
| X25519 | RFC 7748 | [PROBADO] | Intercambio de claves (componente clásico de esquemas híbridos) | Vulnerable a computador cuántico relevante (CRQC) |
| Ed25519 | RFC 8032, FIPS 186-5 | [PROBADO] | Firmas de corta/media vida, firma de eventos de auditoría | Vulnerable a CRQC; firmas no deterministas en variantes "hedged" según implementación |
| ECDSA P-256 | FIPS 186-5 | [PROBADO] | Compatibilidad WebAuthn/HSM/TPM (P-256 es el algoritmo más común en autenticadores) | Requiere buen RNG por firma (o RFC 6979); vulnerable a CRQC |
| RSA-3072+ | FIPS 186-5 | [PROBADO] | Sólo interoperabilidad heredada | Tamaño, rendimiento, vulnerable a CRQC |

## 1.3 Criptografía poscuántica (PQC)

NIST publicó en agosto de 2024 los tres primeros estándares PQC:

| Estándar | Algoritmo | Tipo | Madurez | Uso propuesto | Consideraciones |
|---|---|---|---|---|---|
| FIPS 203 | ML-KEM (Kyber) | KEM basado en retículos | [EXPERIMENTAL→PROBADO en TLS] | Intercambio híbrido `X25519 + ML-KEM-768` para transporte y envoltura de claves de larga vida | Ya desplegado en TLS por navegadores principales como híbrido. Implementaciones con fugas de tiempo documentadas en el pasado (p. ej. "KyberSlash"): exigir implementaciones de tiempo constante y validadas |
| FIPS 204 | ML-DSA (Dilithium) | Firma basada en retículos | [EXPERIMENTAL] | Firma de artefactos de larga vida (firmware, raíz de auditoría, credenciales de servicio) en modo híbrido con Ed25519 | Firmas de ~2.4–4.6 KB; impacto en logs y certificados |
| FIPS 205 | SLH-DSA (SPHINCS+) | Firma basada en hash | [EXPERIMENTAL, supuestos muy conservadores] | Raíz de confianza offline: firma de firmware y de claves raíz (pocas firmas, verificación frecuente) | Firmas grandes (8–50 KB) y lentas; seguridad basada sólo en funciones hash → excelente como raíz |
| SP 800-208 | LMS / XMSS | Firma hash con estado | [PROBADO en firmware] | Alternativa para firma de firmware en hardware | Con estado: reutilizar un índice rompe la seguridad; requiere HSM con gestión de estado |
| FIPS 206 (borrador) | FN-DSA (Falcon) | Firma | [EXPERIMENTAL] [VERIFICAR estado] | No en v1 | Implementación con aritmética flotante difícil de hacer en tiempo constante |
| HQC | KEM basado en códigos | KEM | [EXPERIMENTAL] seleccionado por NIST como respaldo en 2025 [VERIFICAR estado del borrador] | Candidato de agilidad si ML-KEM se debilita | No estandarizado aún |

**Calendario de transición:** NIST IR 8547 (borrador inicial nov-2024) propone deprecar algoritmos clásicos de 112 bits hacia 2030 y prohibir RSA/ECC para cifrado/firma hacia 2035 [VERIFICAR versión final]. CNSA 2.0 (NSA) fija plazos más agresivos para sistemas de seguridad nacional.

**Amenaza "harvest now, decrypt later":** datos con requisito de confidencialidad > 10 años deben protegerse ya con KEM híbrido. Es la justificación principal de PQC en NEXUS VAULT, no el marketing.

## 1.4 Criptografía de umbral y multiparte

| Tecnología | Referencia | Madurez | Uso | Riesgo |
|---|---|---|---|---|
| Shamir Secret Sharing | Shamir 1979 | [PROBADO] | Custodia de la clave raíz de recuperación de cada tenant en M-de-N custodios | Reconstruye el secreto completo en un punto en el momento de uso → hacerlo dentro de HSM/ceremonia |
| FROST (firmas Schnorr de umbral) | RFC 9591 | [EXPERIMENTAL] | Aprobaciones M-de-N verificables criptográficamente (p. ej. firma de checkpoints de auditoría, operaciones críticas) | Pocas implementaciones auditadas; no compatible con HSMs comunes |
| Umbral para ML-DSA | Investigación académica | [EXPERIMENTAL / investigación] | No en v1 | Sin estándar |
| HSM con quórum (M-de-N de tarjetas de operador) | Funcionalidad de fabricantes | [PROBADO] | Ceremonias de claves raíz | Dependencia de fabricante |

**Conclusión:** en v1, el M-de-N se implementa como **quórum de aprobación** (firmas individuales verificadas por el motor de políticas) + **Shamir dentro de HSM** para claves raíz. FROST se evalúa en Fase 3.

## 1.5 Hardware de seguridad

| Tecnología | Madurez | Uso | Límites |
|---|---|---|---|
| HSM de red (FIPS 140-3 nivel 3) | [PROBADO] | Claves raíz de tenant (KEK), firma de auditoría, CA interna | Costoso; el HSM no protege contra uso autorizado indebido — sólo contra extracción |
| Cloud KMS/HSM (AWS KMS/CloudHSM, GCP Cloud HSM, Azure Managed HSM) | [PROBADO] | Despliegue SaaS | Confianza en el proveedor cloud; considerar BYOK/HYOK |
| TPM 2.0 | [PROBADO] | Atestación de arranque medido de endpoints y nodos; sellado de claves de nodo | TPM discreto vulnerable a sniffing del bus (ataques físicos documentados); usar sesiones cifradas de parámetros o fTPM |
| Secure Element (p. ej. familias certificadas Common Criteria EAL5+/6+) | [PROBADO] | Dispositivo NEXUS CUBE, llaves de seguridad | Capacidad limitada; soporte PQC aún escaso [VERIFICAR] |
| TEEs (Intel TDX, AMD SEV-SNP, Arm CCA, Nitro Enclaves) | [EXPERIMENTAL→PROBADO según plataforma] | Procesamiento de datos descifrados en entorno atestado (Fase 3) | Historial de ataques de canal lateral; no basar P1–P3 sólo en TEE |

## 1.6 Identidad y autenticación

| Tecnología | Referencia | Madurez | Notas |
|---|---|---|---|
| WebAuthn Level 2/3 | W3C | [PROBADO] (L3 [VERIFICAR estado de Recomendación]) | API de navegador para credenciales de clave pública |
| FIDO2 / CTAP 2.1–2.2 | FIDO Alliance | [PROBADO] | Protocolo autenticador–cliente |
| Passkeys sincronizadas | Apple/Google/Microsoft + gestores | [PROBADO] | Mejor UX; la clave vive en la nube del proveedor → la confianza se traslada a esa cuenta. Para administradores, exigir passkeys **ligadas a dispositivo** (atestación) |
| Atestación de autenticador / FIDO MDS | FIDO Metadata Service | [PROBADO] | Permite exigir autenticadores certificados (nivel L1–L3) |
| OAuth 2.1 / OIDC | IETF / OpenID | [PROBADO] (OAuth 2.1 en borrador [VERIFICAR]) | Federación con IdPs del cliente |
| DPoP | RFC 9449 | [PROBADO] | Tokens ligados a clave → robo de token inútil sin clave |
| Token Exchange | RFC 8693 | [PROBADO] | Delegación atenuada (clave para CIPHER AI) |
| W3C Verifiable Credentials 2.0 | W3C | [EXPERIMENTAL] Recomendación en 2025 [VERIFICAR] | Credenciales verificables para identidad organizacional |
| SD-JWT / SD-JWT VC | IETF | [EXPERIMENTAL] | Divulgación selectiva sin ZKP compleja |
| BBS signatures | IRTF CFRG borrador | [EXPERIMENTAL] | Divulgación selectiva no vinculable; no PQ |
| ZKP generales (zk-SNARK/STARK) | Investigación + bibliotecas | [EXPERIMENTAL] | Útiles para "mayor de edad" / "empleado activo" sin revelar datos; complejidad alta → Fase 4 como investigación |
| ISO/IEC 30107-3 (PAD / prueba de vida) | ISO | [PROBADO como método de evaluación] | Exigir proveedor evaluado por laboratorio acreditado (p. ej. iBeta) [VALIDACIÓN EXTERNA] |
| NIST SP 800-63-4 | NIST | [PROBADO] (rev. 4 publicada 2025 [VERIFICAR]) | Marco para niveles IAL/AAL/FAL |
| SPIFFE / SPIRE | CNCF | [PROBADO] | Identidad de cargas de trabajo (servicios) con SVIDs X.509 de vida corta |

## 1.7 Auditoría, integridad y cadena de suministro

| Tecnología | Madurez | Uso |
|---|---|---|
| Certificate Transparency (RFC 6962 / 9162) | [PROBADO] | Modelo de log de Merkle con pruebas de inclusión y consistencia |
| Trillian / Tessera (tlog) | [PROBADO] | Implementaciones de logs verificables |
| Testigos (witness cosigning, formato "checkpoint") | [EXPERIMENTAL] | Co-firma externa del tamaño/raíz del log para detectar "split view" |
| Sigstore (cosign, Rekor, Fulcio) | [PROBADO] | Firma y transparencia de artefactos de software |
| SLSA v1.x | [PROBADO] | Niveles de integridad de build |
| in-toto | [PROBADO] | Atestación de pasos de la cadena de suministro |
| SBOM (CycloneDX / SPDX) | [PROBADO] | Inventario de dependencias |
| Reproducible builds | [PROBADO en algunos ecosistemas] | Verificación independiente de binarios |

## 1.8 IA aplicada a ciberseguridad

| Tema | Referencia | Estado |
|---|---|---|
| Riesgos de aplicaciones LLM | OWASP Top 10 for LLM Applications (2025) | [PROBADO como catálogo] |
| Tácticas adversarias contra IA | MITRE ATLAS | [PROBADO como catálogo] |
| Gestión de riesgo IA | NIST AI RMF 1.0 + perfil GenAI (NIST AI 600-1) | [PROBADO como marco] |
| Prompt injection indirecta | Literatura 2023–2026 | **Problema abierto: no existe defensa completa conocida.** Toda la arquitectura de CIPHER AI asume que el modelo *será* manipulado y limita lo que puede hacer |
| Patrones de diseño defensivos (separación planificador/datos, "dual LLM", CaMeL y similares) | Investigación | [EXPERIMENTAL] |
| Regulación | EU AI Act (aplicación escalonada 2025–2027) | [VALIDACIÓN EXTERNA] legal |

## 1.9 Detección y respuesta

| Tecnología | Madurez | Uso |
|---|---|---|
| MITRE ATT&CK / D3FEND | [PROBADO] | Taxonomía de técnicas y contramedidas |
| Sigma (reglas de detección) | [PROBADO] | Formato portable de reglas; CIPHER puede compilar a/desde Sigma |
| OpenTelemetry / OCSF | [PROBADO] | Esquemas de telemetría normalizada |
| eBPF (Linux) / ETW (Windows) / EndpointSecurity (macOS) | [PROBADO] | Telemetría de endpoint |
| osquery | [PROBADO] | Inventario y consultas de endpoint |
| Detección de ransomware por entropía/tasa de renombrado/canarios | [PROBADO como técnica, tasas de falsos positivos variables] | SENTINEL + VAULT |

## 1.10 Políticas y lenguajes de seguridad existentes (para CIPHER)

| Lenguaje | Lección para CIPHER |
|---|---|
| Rego (OPA) | Expresivo pero difícil de razonar; errores de política silenciosos |
| Cedar (AWS) | Diseñado para análisis formal (SMT); sin bucles; tipado; **modelo a seguir** para la parte de autorización |
| Sigma / YARA / KQL / SPL | Detección declarativa; buena portabilidad, poca seguridad de tipos |
| Starlark | Determinista, sin E/S; buen modelo de sandbox |
| Dhall / CUE | Totalidad y configuración tipada |
| Lenguajes con capacidades (E, Pony, WASI) | Autoridad explícita por objeto |

**Conclusión:** CIPHER no compite con lenguajes de propósito general. Su nicho [ORIGINAL] es **unificar política de autorización + reglas de detección + playbooks de respuesta** en un lenguaje total, tipado, con efectos/capacidades explícitos y análisis estático, que compila a un IR verificable. Ver [08-cipher-lenguaje.md](08-cipher-lenguaje.md).

## 1.11 Soluciones existentes (posicionamiento)

| Categoría | Ejemplos de mercado | Qué hace NEXUS CUBE distinto (hipótesis a validar) |
|---|---|---|
| IdP | Okta, Entra ID, Keycloak | Passkey-first, aprobación M-de-N nativa, delegación atenuada a IA |
| Secretos/KMS | HashiCorp Vault/OpenBao, cloud KMS | Integración con datos de negocio y auditoría transparente |
| Backup inmutable | Veeam, Rubrik, Cohesity | Inmutabilidad + claves por compartimento + detección de cifrado anómalo |
| SIEM/XDR | Splunk, Elastic, CrowdStrike, SentinelOne, Wazuh | No competir en v1; integrar y añadir respuesta gobernada por política |
| Copilotos de seguridad | Microsoft Security Copilot, Google SecOps AI | IA sin credenciales propias y con autorización externa verificable |

> El posicionamiento es una **hipótesis de negocio** que requiere validación con clientes reales.

## 1.12 Brechas de conocimiento que requieren especialistas

- Selección final de parámetros PQC y modos híbridos → **criptógrafo** [VALIDACIÓN EXTERNA].
- Evaluación de proveedores de prueba de vida y verificación documental → **laboratorio PAD acreditado**.
- Requisitos de residencia de datos y biometría por país (GDPR art. 9, BIPA, LFPDPPP, LGPD…) → **abogado de privacidad**.
- Diseño de hardware fabricable, certificación FIPS 140-3 / Common Criteria → **ingeniería de hardware + laboratorio acreditado**.
- Verificación formal del núcleo de CIPHER → **investigador en métodos formales**.
