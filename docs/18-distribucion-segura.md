# 18. Página web independiente y distribución controlada del software

> Decisión del fundador (ronda 1): la página web es sólo una presentación del sistema y **no está conectada al software**. El software **no se descarga desde la página**: el interesado escribe un correo, sigue unos pasos estrictos y recibe un enlace seguro de descarga. Ver [ADR-0010](adr/ADR-0010-web-independiente-distribucion-controlada.md).

## 18.1 Página web de presentación

| Requisito | Implementación |
|---|---|
| Independencia total | Sitio **estático** en un proveedor y una cuenta distintos a los de la infraestructura del producto. Sin credenciales compartidas, sin API, sin base de datos, sin inicio de sesión |
| Sin descargas | No hay ningún binario alojado. El sitio dice explícitamente: "NEXUS nunca envía el software por correo adjunto ni lo publica en esta web" |
| Contacto | Sólo un correo oficial (enlace `mailto:`). Sin formularios conectados a sistemas internos |
| Superficie mínima | Sin scripts de terceros ni rastreadores; CSP estricta; HTTPS con HSTS (preload) |
| Afirmaciones | Sólo las que tengan evidencia (ver regla 13). Prohibido "inhackeable" o "reduce el 99 % de los ataques" hasta poder demostrarlo |
| Huella de la clave de firma | Se publica la huella de la clave de firma de releases, que también se entrega por un segundo canal |

Que la web no esté conectada al producto es una buena decisión de seguridad: si la web es comprometida, el atacante no gana acceso al sistema ni a los clientes.

## 18.2 Proceso de solicitud y descarga

```mermaid
sequenceDiagram
  autonumber
  actor C as Empresa interesada
  participant MAIL as Correo oficial NEXUS
  participant COM as Equipo comercial / cumplimiento
  participant PORT as Portal de distribución<br/>(dominio e infraestructura separados de la web)
  participant TR as TRUST

  C->>MAIL: Solicitud desde el correo corporativo (no Gmail/Hotmail)
  COM->>COM: Verifica la empresa: certificado de existencia y representación legal (Cámara de Comercio / RUES), NIT
  COM->>C: Videollamada: identidad del representante legal y del administrador técnico
  COM->>C: Contrato + acuerdo de tratamiento de datos (firma electrónica, Ley 527 de 1999)
  C->>COM: Orden de compra / pago
  COM->>PORT: Alta de la organización (requiere 2 aprobadores internos de NEXUS)
  PORT->>TR: Registra el alta
  COM->>C: Envío físico o compra de 2 llaves FIDO2 para el administrador
  PORT-->>C: Correo con invitación de un solo uso (expira en 72 h, sin adjuntos)
  C->>PORT: Registra su llave FIDO2 (passkey) durante una videollamada de activación
  C->>PORT: Inicia sesión con la llave → descarga el instalador
  PORT->>TR: Registra la descarga (quién, cuándo, versión, hash)
  COM->>C: Huella SHA-256 del instalador y de la clave de firma por segundo canal (teléfono / documento firmado)
  C->>C: Instala; el instalador verifica las firmas
  C->>PORT: Activación de la organización con token de un solo uso + atestación TPM del primer equipo
```

### Por qué no basta con "un enlace por correo"
- El correo se puede **falsificar** y los enlaces se pueden **reenviar o interceptar**. Por eso el enlace **no descarga nada por sí solo**: sólo abre el portal, que exige la **llave FIDO2** registrada por la empresa.
- Los atacantes enviarán correos falsos "de NEXUS" con instaladores maliciosos. Mitigación: el dominio de correo con SPF, DKIM y DMARC en modo `reject`, nunca adjuntos, y formación al cliente: *"NEXUS nunca envía instaladores; sólo descargue desde el portal con su llave."*

## 18.3 Instalación en los equipos de la empresa

- El administrador de la empresa distribuye el instalador a sus equipos con su herramienta corporativa (Intune, GPO, etc.) o manualmente.
- Cada equipo se **inscribe** con un token de inscripción de la organización **y** la atestación TPM del equipo; el administrador aprueba los equipos (o una regla de política lo hace).
- Un instalador copiado fuera de la empresa no sirve sin un token de inscripción válido.

## 18.4 Separación de infraestructuras

| Sistema | Infraestructura | ¿Contiene datos de clientes? |
|---|---|---|
| Web de presentación | Proveedor A, cuenta propia | No |
| Correo corporativo | Proveedor de correo | Sólo comunicaciones comerciales |
| Portal de distribución y licencias | Infraestructura B | Datos de la empresa cliente y del administrador; no datos de sus empleados |
| NEXUS Server gestionado | Infraestructura C (por región) | Sólo datos cifrados |
| Facturación / pagos | Proveedor de pagos | Datos de facturación; separado del producto |

## 18.5 Riesgos residuales
- Fricción comercial (el proceso es lento). Es intencional para el segmento empresarial, pero hay que medir el tiempo de alta.
- Ingeniería social al equipo comercial → el alta exige 2 aprobadores internos y verificación documental.
