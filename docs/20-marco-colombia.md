# 20. Marco normativo inicial: Colombia

> **[VALIDACIÓN EXTERNA]** Este documento es un inventario preliminar para orientar el diseño, **no es asesoría legal**. Debe revisarlo un abogado colombiano especializado en protección de datos y en TIC. Todas las referencias están marcadas como **[VERIFICAR]**, porque las normas pueden haberse modificado.

## 20.1 Normas relevantes

| Norma | Tema | Impacto en NEXUS CUBE |
|---|---|---|
| **Ley 1581 de 2012** (Habeas Data) y **Decreto 1377 de 2013** (compilado en el Decreto Único 1074 de 2015) | Protección de datos personales | NEXUS es **encargado** del tratamiento de los datos de sus clientes y **responsable** de los datos de sus propios clientes y contactos. Requiere política de tratamiento, contratos de transmisión y atención de derechos |
| Datos sensibles (art. 5, Ley 1581) | Incluye datos **biométricos** | Refuerza [ADR-0005](adr/ADR-0005-biometria-solo-local.md): la biometría queda sólo en el dispositivo. Si se usara verificación documental o prueba de vida, se necesita consentimiento explícito y facultativo |
| Transferencias internacionales (art. 26, Ley 1581) | Envío de datos a otros países | Afecta a dónde se alojan los servidores gestionados y al proveedor de IA. Preferir una región de alojamiento compatible y contratos adecuados; o NEXUS Server on-premise |
| **Superintendencia de Industria y Comercio (SIC)** | Autoridad de protección de datos | Registro Nacional de Bases de Datos (RNBD) cuando aplique; reporte de incidentes de seguridad a la SIC |
| **Ley 1273 de 2009** | Delitos informáticos | Las pruebas ofensivas siempre con autorización escrita (regla 11): el acceso abusivo a un sistema informático es delito |
| **Ley 527 de 1999** y Decreto 2364 de 2012 | Mensajes de datos y firma electrónica | Validez de contratos y aprobaciones firmadas electrónicamente; las firmas WebAuthn M-de-N pueden apoyarse en este marco (validar) |
| **Superintendencia Financiera (SFC)**: Circular Externa 007 de 2018 sobre ciberseguridad, incorporada a la Circular Básica Jurídica | Requisitos para entidades vigiladas | Si se vende a bancos o aseguradoras: gestión de riesgo de terceros, reporte de incidentes, ubicación de datos y servicios en la nube |
| **CONPES 3995 de 2020** | Política nacional de confianza y seguridad digital | Contexto de política pública |
| Convenio de Budapest (Colombia adherida) | Cooperación internacional en ciberdelito | Contexto para la respuesta a incidentes |
| colCERT / CSIRT sectoriales | Coordinación de incidentes | Canales de reporte y cooperación |

## 20.2 Implicaciones de diseño inmediatas
1. **Residencia de datos configurable** por cliente desde la Fase 2.
2. **Plantillas de contrato de transmisión de datos** (encargado) y acuerdo de nivel de servicio.
3. **Procedimiento de notificación de incidentes** que permita al cliente cumplir sus plazos ante la SIC/SFC: los informes de TRUST y SENTINEL deben exportarse con evidencia verificable.
4. **Proveedor de IA:** verificar dónde procesa los datos; para clientes sensibles, usar un modelo local o alojado en una región adecuada.

## 20.3 Expansión mundial (posterior)
Antes de entrar en cada país: equivalente local de protección de datos (GDPR en la UE, LGPD en Brasil, LFPDPPP en México, leyes estatales en EE. UU., incluida la BIPA de Illinois para biometría), controles de exportación de criptografía y certificaciones que exija el mercado (SOC 2, ISO 27001, y FIPS 140-3 o Common Criteria para sector público).
