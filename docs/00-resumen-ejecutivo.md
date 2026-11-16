# 0. Resumen ejecutivo

## Qué es NEXUS CUBE

NEXUS CUBE es una plataforma de seguridad empresarial que integra siete módulos independientes —**CORE, ID, VAULT, CIPHER, CIPHER AI, SENTINEL, TRUST**— y, opcionalmente, un dispositivo físico (el "cubo") que actúa como raíz de confianza local para organizaciones que no quieren depender exclusivamente de la nube.

No es un antivirus. Su propuesta de valor es **reducir el radio de impacto de un compromiso** y **hacer verificable** lo que ocurre con identidades, claves, datos y acciones administrativas.

## Problema que aborda

Las organizaciones pequeñas y medianas combinan hoy 6–12 productos (IdP, gestor de secretos, backup, EDR, SIEM, KMS…) con integraciones frágiles. Los incidentes graves suelen seguir el mismo patrón: credencial robada → movimiento lateral → privilegios administrativos amplios → cifrado/exfiltración → logs borrados. NEXUS CUBE ataca cada eslabón:

| Eslabón del ataque | Respuesta de diseño |
|---|---|
| Credencial robada (phishing) | Passkeys/FIDO2 resistentes a phishing como factor por defecto (NEXUS ID) |
| Movimiento lateral | Identidad de servicio mTLS + autorización por petición; sin red "confiable" (CORE) |
| Privilegio amplio | Sin administrador universal; acciones sensibles con aprobación M-de-N y acceso *just-in-time* |
| Cifrado / borrado de datos | Versionado inmutable con retención bloqueada y copias aisladas (VAULT) |
| Exfiltración | Claves por tenant y por compartimento; descifrado auditado y limitado en tasa |
| Borrado de rastro | Log de auditoría en árbol de Merkle con testigos externos (TRUST) |

## Propiedades de seguridad objetivo (medibles)

Estas son **metas de diseño**, no capacidades demostradas. Cada una tiene una prueba asociada en el [plan de pruebas](15-plan-pruebas.md).

| ID | Propiedad | Cómo se medirá |
|---|---|---|
| P1 | Ningún secreto individual permite descifrar datos de más de un tenant | Revisión de jerarquía de claves + prueba de compromiso simulado de cada clave |
| P2 | Ninguna persona sola puede leer datos de cliente, exportar claves ni borrar logs | Prueba de cada ruta administrativa; cada una debe exigir ≥2 aprobadores |
| P3 | El compromiso total de un nodo de servicio expone como máximo las claves de datos en memoria de ese nodo durante la ventana de caché | Ejercicio de red team con acceso root a un nodo |
| P4 | Toda modificación o truncado del log de auditoría es detectable por un verificador externo | Prueba de manipulación con verificador independiente |
| P5 | Ransomware con credenciales de un usuario no puede destruir versiones previas dentro del periodo de retención | Simulación en laboratorio con credenciales de usuario y de admin de tenant |
| P6 | La IA no puede ejecutar ninguna acción ni leer ningún dato que el usuario solicitante no podría leer/ejecutar por sí mismo | Batería de inyección de prompt + verificación del motor de autorización |
| P7 | Ninguna plantilla biométrica sale del dispositivo del usuario en el modo por defecto | Inspección de tráfico y de esquema de datos |
| P8 | Rotación de un algoritmo criptográfico sin parada de servicio ni re-cifrado masivo inmediato | Ejercicio de agilidad criptográfica |

## No-objetivos (explícitos)

- **No** se afirma que el sistema sea inhackeable.
- **No** se inventan primitivas criptográficas; solo se componen primitivas estandarizadas mediante bibliotecas auditadas.
- **No** se pretende reemplazar en v1 a un EDR comercial maduro; SENTINEL empieza integrando telemetría existente.
- **No** se promete cumplimiento normativo (GDPR, HIPAA, PCI DSS, NIS2, etc.) por diseño: se diseñan controles que *facilitan* auditorías, que deben realizar terceros.
- **No** se fabrica hardware en las primeras fases.

## Reglas innegociables

1. No inventar algoritmos criptográficos para sustituir estándares auditados.
2. No almacenar plantillas biométricas centralizadas sin justificación y evaluación de impacto de privacidad (DPIA).
3. No usar huellas dactilares (ni ninguna biometría) directamente como claves de cifrado.
4. La IA no tiene acceso irrestricto a bases de datos ni a claves.
5. Ningún administrador tiene acceso universal por defecto.
6. No existe una clave maestra universal.
7. Un dispositivo autenticado no es, por eso, confiable.
8. Ninguna comunicación interna sin autenticación y autorización.
9. Una vulnerabilidad de un cliente no compromete a otros clientes.
10. Ningún dato sensible en logs.
11. Ninguna prueba ofensiva fuera de infraestructuras expresamente autorizadas.
12. Ningún componente crítico sin modelo de amenazas y pruebas.
13. Ninguna funcionalidad se presenta como segura sin evidencia.
14. Ninguna certificación ni resultado de auditoría inventado.

Los conflictos entre funcionalidad y seguridad se registran como ADR con estado "En revisión" y requieren aprobación del responsable de seguridad.

## Decisiones de arquitectura clave (resumen)

1. **Monolito modular → servicios** sólo donde el aislamiento lo justifique (VAULT-crypto, ID, TRUST, AI-gateway). Ver [ADR-0001](adr/ADR-0001-monolito-modular-con-servicios-aislados.md).
2. **Criptografía híbrida clásica + poscuántica** para intercambio de claves y firmas de larga vida. Ver [ADR-0002](adr/ADR-0002-criptografia-hibrida.md).
3. **CIPHER es un lenguaje de políticas y automatización, no de propósito general**: total, sin E/S arbitraria, con capacidades explícitas. Ver [ADR-0003](adr/ADR-0003-cipher-lenguaje-restringido.md).
4. **La IA nunca porta credenciales propias**: actúa con el token delegado y atenuado del humano solicitante. Ver [ADR-0004](adr/ADR-0004-ia-sin-credenciales-propias.md).
5. **Biometría sólo local** (desbloqueo del autenticador); el servidor nunca la ve. Ver [ADR-0005](adr/ADR-0005-biometria-solo-local.md).
6. **Auditoría como log de transparencia** con co-firma de testigos externos. Ver [ADR-0006](adr/ADR-0006-auditoria-log-transparencia.md).

## Primer prototipo propuesto (Etapa 4)

Un único componente pequeño y verificable: **la librería de envoltura de claves de NEXUS VAULT** (envelope encryption con AEAD estándar, contexto vinculado y formato versionado) más su verificador de vectores de prueba. Justificación y criterios en la [hoja de ruta](14-hoja-de-ruta.md#fase-1).
