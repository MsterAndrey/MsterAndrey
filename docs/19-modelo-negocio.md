# 19. Modelos de pago y licenciamiento

> Mercado objetivo (decisión del fundador): **empresas de 100 a 1 000 empleados** de los sectores **legal y salud**, empezando en **Colombia** y expandiendo después a nivel mundial. El plan **Profesional** es la oferta principal del piloto. Los precios de este documento son **hipótesis de partida** para validar con clientes reales; no son resultado de un estudio de mercado.

## 19.1 Principios

1. **Se cobra por valor y por riesgo reducido, demostrado con evidencia.** No se puede vender con la promesa "reduce un 99 % los hackeos" mientras no haya datos que lo respalden (regla 13). El argumento comercial se basa en propiedades verificables: nadie puede leer los datos sin autorización, el ransomware no puede destruir las versiones anteriores, la auditoría no se puede manipular, y la recuperación se ha probado.
2. **La licencia nunca secuestra los datos del cliente.** Si la licencia vence o no se paga, el sistema pasa a **modo de sólo lectura y recuperación**: el cliente siempre puede descifrar y exportar su información. Bloquear el acceso a los datos cifrados por falta de pago sería, en la práctica, comportarse como ransomware y un riesgo legal y reputacional.
3. **Los pagos están separados del producto.** El procesador de pagos y la facturación no tienen conexión con los sistemas que manejan claves o datos de clientes.
4. **La licencia se verifica sin conexión**: archivo de licencia firmado (`NC-SIG-1`), sin un "interruptor de apagado" remoto.

## 19.2 Planes (hipótesis)

| Plan | Para quién | Incluye | Precio de referencia (hipótesis) |
|---|---|---|---|
| **Esencial** | Empresas pequeñas (10–100 empleados) | App de escritorio, carpetas protegidas, gestión del cifrado de disco, passkeys, copias cifradas con 30 días de versiones inmutables, auditoría TRUST, NEXUS Server gestionado | USD 12–20 por usuario al mes (facturación anual) |
| **Profesional** | Medianas (100–1 000) | + políticas CIPHER, aprobaciones M-de-N, SENTINEL básico, integración con el IdP y el EDR existentes, 90 días de versiones | USD 25–40 por usuario al mes |
| **Empresarial** | Grandes (1 000+) / multinacionales | + CIPHER AI, NEXUS Server on-premise o dedicado, HYOK, retención configurable, SLA 99,9 %, gerente de cuenta | USD 45–80 por usuario al mes, con mínimo anual |
| **Crítico / Soberano** | Infraestructura crítica, banca, gobierno, salud | Despliegue aislado, hardware NEXUS CUBE (cuando exista), testigo TRUST propio, soporte 24/7, simulacros de recuperación incluidos | Contrato a medida (orden de magnitud: desde cientos de miles de USD al año) |

Precio en Colombia: en **COP**, con un ajuste por paridad de poder adquisitivo a definir. Precio internacional: en **USD/EUR**.

## 19.3 Complementos

| Complemento | Modelo |
|---|---|
| CIPHER AI (planes Esencial y Profesional) | Por usuario al mes, o por volumen de consultas |
| SENTINEL gestionado (servicio de detección y respuesta 24/7, MDR) | Por equipo al mes. Requiere un centro de operaciones (SOC) propio o de un socio |
| Fragmento de custodia de recuperación ([ADR-0008](adr/ADR-0008-recuperacion-asistida-por-ia.md)) | Tarifa anual por organización |
| Retención extendida de versiones | Por TB al mes |
| Hardware NEXUS CUBE (Fase 4) | Venta o arriendo + suscripción |
| Respuesta a incidentes y análisis forense | Bolsa de horas prepagada |

## 19.4 Servicios profesionales
Implementación y migración, formación de administradores y custodios, simulacros de recuperación y de ransomware (en un entorno autorizado), y apoyo a auditorías del cliente (SOC 2, ISO 27001, normas de la SFC).

## 19.5 Canales
- **Venta directa** en Colombia para los primeros 10–20 clientes (aprendizaje).
- **Socios MSP/MSSP** (proveedores de servicios gestionados y de seguridad) con precio mayorista (descuento orientativo del 20–35 %) para escalar en Latinoamérica.
- **Distribuidores** por país para la expansión mundial, con certificación técnica obligatoria del socio.
- Mercados de los proveedores cloud (AWS/Azure Marketplace), más adelante.

## 19.6 Facturación y cobro

| Ámbito | Consideraciones [VERIFICAR con contador/abogado] |
|---|---|
| Colombia | Facturación electrónica DIAN; IVA (tarifa general del 19 %, revisar si aplica alguna exclusión o tratamiento especial a licencias de software); retenciones en la fuente; contratos en COP |
| Internacional | IVA/VAT o impuesto sobre ventas según el país; considerar un *merchant of record* (p. ej. Paddle) para pagos con tarjeta, o transferencia internacional en contratos empresariales; tratados de doble imposición |
| Controles de exportación | El software criptográfico puede estar sujeto a controles (p. ej. EAR de EE. UU. si hay componentes o presencia allí, Arreglo de Wassenaar). Revisión legal antes de vender en cada país |

## 19.7 Garantías: con cautela
Algunos proveedores ofrecen "garantías contra ransomware". Sólo debe considerarse con **una aseguradora detrás**, con condiciones claras y con datos operativos reales (Fase 3 o posterior). Prometerlo antes es un riesgo financiero y de credibilidad.

## 19.8 Métricas a validar en el piloto
Disposición a pagar por segmento, tiempo de alta (el proceso de distribución es estricto), coste de soporte por cliente, abandono de clientes y número de incidentes evitados *con evidencia* (casos documentados).
