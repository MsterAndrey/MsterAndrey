# 15. Plan de pruebas y validación

> Ninguna de estas pruebas se ha ejecutado aún. Los resultados se documentarán en `docs/resultados/` cuando existan, con fecha, versión, entorno y evidencia reproducible.

## 15.1 Reglas de las pruebas ofensivas

- Sólo en **laboratorio propio**, sistemas de NEXUS o infraestructuras de clientes con **autorización escrita** (alcance, ventanas, contactos, reglas de enfrentamiento).
- Sin datos reales de clientes en laboratorio.
- Malware de prueba: simuladores inertes (p. ej. herramientas de emulación de adversarios como Atomic Red Team / Caldera) en redes aisladas.

## 15.2 Tipos de prueba

| Tipo | Herramientas candidatas | Alcance | Frecuencia |
|---|---|---|---|
| Unitarias | `cargo test`, `go test`, Vitest | Todo el código | Cada commit |
| Propiedades | proptest, gopter, fast-check | Criptografía, PDP, CIPHER | Cada commit |
| Integración | Docker Compose / testcontainers | Flujos entre servicios, incluida autorización | Cada PR |
| Matriz de autorización | Generada desde políticas CIPHER | Rol × endpoint × propiedad del recurso × tenant | Cada PR |
| Fuzzing | cargo-fuzz/libFuzzer, AFL++, Go native fuzzing; OSS-Fuzz si se libera código | Parsers (NCOBJ, CIPHER, WebAuthn, OCSF), APIs | Continuo (≥ 24 h/semana por objetivo) |
| Fuzzing diferencial | Evaluador CIPHER prod vs. referencia; AEAD vs. otra implementación | Criptografía, CIPHER | Continuo |
| SAST | Semgrep, CodeQL, clippy (pedantic + reglas de seguridad), gosec | Todo | Cada PR |
| DAST | OWASP ZAP autenticado, Nuclei con plantillas propias | Entornos de staging | Semanal |
| SCA y dependencias | cargo-audit/cargo-deny, govulncheck, osv-scanner, Dependabot/Renovate con revisión humana | Todo | Diario |
| Secretos | gitleaks/trufflehog en pre-commit y CI | Repositorio | Cada commit |
| Criptográficas | Vectores NIST ACVP / Wycheproof; pruebas de tiempo constante (dudect) donde aplique; revisión de uso de nonces | Librerías y wrappers | Cada PR |
| Verificación formal | Kani/Verus (Rust), Z3 para políticas, TLA+ para protocolos de aprobación y TRUST | Evaluador CIPHER, protocolo M-de-N, consistencia del log | Por release |
| Aislamiento | Pruebas cruzadas entre tenants automáticas (datos, claves, telemetría, IA) | Multi-tenant | Cada PR + nocturno |
| Recuperación | Restauración real desde backup aislado a entorno limpio; ceremonia de shares | VAULT, metadatos, TRUST | Trimestral |
| Caos | Caída de PDP/HSM/TRUST/región | Disponibilidad y fail-closed | Mensual (staging) |
| IA adversarial | Corpus de inyección directa/indirecta, extracción, abuso de herramientas | CIPHER AI | Cada cambio de modelo/prompt + nocturno |
| Red Team | Equipo externo con reglas de enfrentamiento | Plataforma completa | Antes de GA y anual |
| Auditoría externa | Auditoría de código criptográfico, pentest, auditoría de procesos (SOC 2/ISO) | Según fase | Por fase |

## 15.3 Pruebas ligadas a las propiedades P1–P8

| Propiedad | Prueba |
|---|---|
| P1 | Para cada tipo de clave, simular su compromiso y enumerar los datos descifrables; debe ser ⊆ un tenant |
| P2 | Para cada operación marcada sensible, intentar completarla con un único actor (incluidos admin de tenant y operador); todas deben fallar |
| P3 | Red team con root en un nodo de Crypto Worker: medir DEKs obtenibles y tiempo hasta detección |
| P4 | Truncar/reescribir el log con acceso a su base; el verificador independiente debe reportar inconsistencia |
| P5 | Script de cifrado masivo con credenciales de admin de tenant; verificar restauración completa al punto previo |
| P6 | Para cada herramienta de IA, comparar el conjunto de recursos alcanzables vía IA con el alcanzable por el usuario; debe ser ⊆ |
| P7 | Captura de tráfico durante registro y autenticación + análisis de esquema; ningún dato biométrico |
| P8 | Introducir una suite nueva y retirar una antigua en staging sin downtime; medir objetos pendientes de re-envoltura |

## 15.4 Criterios objetivos de aprobación y rechazo

Un release **se rechaza** si cualquiera de los siguientes es cierto:

| # | Criterio de rechazo |
|---|---|
| 1 | Cualquier test unitario, de integración o de matriz de autorización falla |
| 2 | Hallazgo SAST/DAST/SCA de severidad crítica o alta sin resolución o sin excepción aprobada (con fecha de expiración y firma del responsable de seguridad) |
| 3 | Cualquier crash o hallazgo de sanitizer en fuzzing de un componente crítico sin corregir |
| 4 | Divergencia en fuzzing diferencial |
| 5 | Cualquier vector de prueba criptográfico falla |
| 6 | Cualquier prueba de aislamiento entre tenants falla |
| 7 | Cualquier acción con efecto de la IA ejecutada sin confirmación humana en la batería adversarial |
| 8 | Cobertura de ramas < 85 % en componentes críticos (crypto, PDP, CIPHER evaluador, TRUST) — métrica de higiene, no de seguridad |
| 9 | Uso de `unsafe` en Rust no justificado en lista revisada |
| 10 | Primitiva criptográfica fuera de la lista permitida (CBOM) |
| 11 | Campo no permitido en esquema de logs |
| 12 | Artefacto sin firma o build no reproducible (componentes críticos, desde Fase 2) |
| 13 | Última prueba de recuperación > 100 días o fallida (para releases de producción) |

Un release **se aprueba** sólo si ningún criterio de rechazo aplica **y** la evidencia (logs de CI, informes) está archivada y enlazada desde las notas del release.

## 15.5 Formato de informe de resultados

```
docs/resultados/AAAA-MM-DD-<componente>-<tipo>.md
- Versión / commit
- Entorno
- Procedimiento exacto (reproducible)
- Resultado (pasa / falla) por criterio
- Hallazgos con severidad (CVSS v4 donde aplique)
- Evidencia (enlaces a artefactos)
- Responsable y revisor
```
