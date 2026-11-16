# ADR-0009 — Local-first: aplicación instalada en el computador

**Estado:** Propuesto (por decisión del fundador, ronda 1)

## Contexto
El fundador decide que el sistema debe instalarse en el computador y cifrar la información del personal y de las empresas, y que la web no esté conectada al software.

## Decisión
- La interfaz principal es una **aplicación de escritorio** (Windows primero, luego macOS y Linux), con un servicio local en Rust que cifra los datos en el equipo.
- Las claves de dispositivo viven en el TPM o el Secure Enclave; la biometría es local.
- Se usa el cifrado de disco del sistema operativo (no se reimplementa) más carpetas protegidas con cifrado por archivo más copias versionadas inmutables en NEXUS Server (on-premise o gestionado), que sólo almacena texto cifrado.
- Se evitan los controladores de kernel en las primeras fases.

## Modo de servidor (ronda 3)
Ambas opciones, **principalmente NEXUS Server gestionado por NEXUS**, para controlar la integridad de la infraestructura y evitar manipulaciones locales. Aun gestionado por NEXUS, el servidor sólo almacena texto cifrado y no posee claves de los clientes: gestionar la infraestructura no equivale a tener acceso a los datos. On-premise queda para los planes Empresarial y Crítico.

## Consecuencias
+ El servidor nunca ve datos en claro, lo que reduce el impacto de una brecha del servidor.
+ Funciona sin conexión durante un periodo limitado.
− Mayor coste de desarrollo y soporte multiplataforma.
− Funciones de servidor sobre el contenido (búsqueda, análisis de la IA sobre los documentos) limitadas o trasladadas al equipo.
− Riesgo de pérdida de datos por fallos del cliente → copias versionadas y pruebas de recuperación obligatorias.

## Alternativas
SaaS web (el diseño de la versión 0.1): pasa a ser complementaria, no la principal.
