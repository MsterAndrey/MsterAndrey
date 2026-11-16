# nexus-diagnostico

Herramienta que la empresa cliente ejecuta **antes de la venta** para saber qué equipos pueden usar
NEXUS CUBE ([ADR-0012](../../docs/adr/ADR-0012-tpm-2-obligatorio.md): TPM 2.0 obligatorio).

- **Sólo lectura:** no cambia nada en el equipo.
- **Sin red:** no envía nada; el informe se guarda en el propio equipo y el cliente decide si lo comparte.
- **Sin datos personales:** no lee usuarios, archivos ni números de serie. Con `--anonimo`, tampoco el nombre ni el modelo del equipo.
- La recogida usa un script de PowerShell incluido en el programa y legible en [`src/collect.ps1`](src/collect.ps1).
  Una prueba automática verifica que no contiene cmdlets de red ni de escritura.

## Qué comprueba

| Comprobación | Bloquea | Requiere acción | OK |
|---|---|---|---|
| TPM | Sin TPM, o TPM 1.2 | TPM 2.0 desactivado | TPM 2.0 activo y listo |
| Windows | Anterior a Windows 10 | Windows 10 (sin soporte gratuito desde el 14-oct-2025) | Windows 11 |
| Secure Boot | — | Desactivado / BIOS heredada | Activado |
| BitLocker (unidad del sistema) | — | Sin proteger | Protegida |
| Actualizaciones | — | Más de 45 días sin actualizar | Al día |

Veredictos: **APTO**, **APTO CON ACCIONES**, **NO APTO** o **INCOMPLETO** (faltan datos, normalmente por no ejecutarla como administrador).

## Uso en Windows

En PowerShell **como administrador**:

```powershell
.\nexus-diagnostico.exe                 # muestra el resultado y guarda nexus-diagnostico-<EQUIPO>.json
.\nexus-diagnostico.exe --anonimo       # sin nombre ni modelo del equipo
```

Para una empresa con muchos equipos: reunir los `.json` en una carpeta y ejecutar

```powershell
.\nexus-diagnostico.exe --consolidar C:\ruta\informes   # crea nexus-diagnostico-consolidado.csv
```

## Compilar y probar

```bash
cargo test -p nexus-diagnostico                    # en cualquier sistema (usa datos de ejemplo)
cargo build -p nexus-diagnostico --release         # en Windows produce nexus-diagnostico.exe
```

La integración continua compila y ejecuta la herramienta en un Windows real de GitHub y publica el `.exe` como artefacto descargable.

## Limitaciones

- **No se ha ejecutado en un equipo físico con Windows** durante su desarrollo; sólo con datos de ejemplo y en la CI.
  Debe probarse en varios equipos reales (con y sin TPM, Windows 10 y 11, Home y Pro) antes de entregarse a clientes.
- El `.exe` no está firmado digitalmente. Antes de distribuirlo a clientes debe firmarse con un certificado de firma de código (Authenticode), o Windows SmartScreen lo advertirá.
- En Windows Home, BitLocker puede aparecer como «desconocido» (Home usa «Cifrado de dispositivo»).
- La detección de máquinas virtuales es heurística (fabricante y modelo).
