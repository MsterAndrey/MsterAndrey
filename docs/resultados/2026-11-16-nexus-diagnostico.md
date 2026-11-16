# Resultados — nexus-diagnostico 0.1.0

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Componente | `crates/nexus-diagnostico` |
| Entornos | Linux (pruebas con datos de ejemplo) y Windows real de GitHub Actions (`windows-latest`) |
| Equipos físicos probados | **Ninguno todavía** |

## Pruebas automáticas
- 17 pruebas (reglas, codificación para PowerShell, script sin red ni escritura, informe anónimo, CSV con protección contra fórmulas, ejecutable de extremo a extremo): **pasan** en Linux y en Windows.
- El código para Windows se compila y pasa clippy sin avisos (`x86_64-pc-windows-gnu` y `windows-latest`).

## Primera ejecución real (máquina virtual de GitHub Actions)
```
Modelo:     Microsoft Corporation Virtual Machine
VEREDICTO:  NO APTO
[BLOQUEA] TPM 2.0: No se detectó un TPM habilitado (máquina virtual: requiere TPM virtual, vTPM)
[OK]      Windows: Microsoft Windows Server 2025 Datacenter (compilación 26100)
[ACCIÓN]  Arranque seguro (Secure Boot): Desactivado o arranque heredado (BIOS legacy)
[ACCIÓN]  Cifrado de disco (BitLocker): La unidad del sistema no está protegida
[OK]      Actualizaciones de Windows: Última actualización hace 24 días
```
La recogida de datos funcionó de extremo a extremo y el veredicto **NO APTO** es correcto: la máquina no tiene TPM.

## Hallazgos y correcciones
- **D-1:** Windows Server 2025 se marcaba como «OK» porque comparte compilación (26100) con Windows 11. **Corregido:** Windows Server es ahora bloqueante para NEXUS CUBE Desktop. Prueba `windows_server_y_vm_sin_vtpm` con los datos reales de esta ejecución.
- **D-2:** en máquinas virtuales sin TPM, la recomendación hablaba de la BIOS. **Corregido:** ahora indica activar el vTPM en el hipervisor.
- **CI:** acciones actualizadas (checkout v6.0.2, setup-node v6.3.0, upload-artifact v6.0.0) por la obsolescencia de Node.js 20 en GitHub Actions.

## Pendiente
- Probar en equipos físicos: Windows 11 con TPM, Windows 10 con fTPM desactivado, equipo sin TPM, Windows Home.
- Firmar el `.exe` (Authenticode) antes de entregarlo a clientes.
