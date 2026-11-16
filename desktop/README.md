# NEXUS CUBE Desktop — prototipo de interfaz

Prototipo navegable de la aplicación de escritorio ([docs/17](../docs/17-aplicacion-escritorio.md)).
**Datos ficticios, Windows Hello simulado y sin cifrado real.** La interfaz lo indica en todo momento.

## Pantallas

| Pantalla | Qué muestra |
|---|---|
| Bloqueo | Desbloqueo con Windows Hello (simulado; en el producto lo muestra Windows) |
| Inicio | Estado del equipo, carpetas, copia de seguridad, aprobaciones, actividad |
| Carpetas protegidas | Una carpeta por cliente o caso ([ADR-0011](../docs/adr/ADR-0011-compartimentos-legales-por-cliente-o-caso.md)), personas con acceso, versiones, nueva carpeta |
| Recuperación | CIPHER AI propone un plan; la persona lo confirma con Windows Hello; se restaura en una carpeta nueva ([ADR-0008](../docs/adr/ADR-0008-recuperacion-asistida-por-ia.md)) |
| Actividad | Registro de NEXUS TRUST con recibos y verificación de integridad |
| Este equipo | TPM 2.0, Windows Hello, BitLocker, arranque seguro, trabajo sin conexión |

## Consola de administración (sección «Administración»)

Gestión de las personas y los accesos de la organización. **Requiere NEXUS Server, que aún no existe**: en el
navegador se muestra con datos ficticios; en la aplicación instalable explica que llegará con el servidor.

| Pestaña | Qué permite | Regla de seguridad |
|---|---|---|
| Personas | Invitar, suspender, solicitar baja | Suspender es inmediato; la baja necesita 2 custodios |
| Accesos | Ver quién abre cada carpeta, retirar o solicitar acceso | Retirar es inmediato; dar acceso lo aprueba el socio responsable; se bloquean los conflictos de intereses |
| Aprobaciones | Aprobar o rechazar solicitudes con Windows Hello | Sólo aprueban las personas autorizadas; nadie aprueba sus propias solicitudes |
| Equipos | Revocar un equipo perdido o robado | Inmediato; sus claves dejan de servir al reconectarse |
| Funciones | Administración de identidad, custodio, auditoría | Nadie lo puede todo; administrar no da acceso al contenido (ADR-0007) |
| Registro | Acciones administrativas | Todo queda registrado |

El contrato está en `src/service/admin.ts`; la simulación, en `src/service/adminMock.ts`.

## Instalador de Windows
La CI genera `NEXUS CUBE_<versión>_x64-setup.exe` (NSIS): instalación para todo el equipo, acceso en el menú Inicio,
desinstalador, opción «Ejecutar NEXUS CUBE» al terminar, instala WebView2 si falta y no necesita las librerías de
Visual C++ (enlazadas estáticamente). La aplicación se ejecuta **sin** permisos de administrador (mínimo privilegio).

## Arquitectura

- `src/service/types.ts` define el **contrato** entre la interfaz y el servicio local de NEXUS (Rust). La interfaz
  nunca recibe claves: sólo estados y resultados. Las acciones con efecto requieren `confirmWithWindowsHello`.
  CIPHER AI sólo puede llamar a `proposeRestore`, que no modifica nada.
- `src/service/mock.ts` es la simulación actual. En la Fase 2 se sustituye por el cliente del servicio real
  (dentro de un contenedor Tauri) sin cambiar las pantallas.
- `CipherCore` e `Icon` están copiados de `web/`; deben unificarse en un paquete compartido cuando el código madure.

## Ejecutar

```bash
cd desktop
npm install
npm run dev      # http://localhost:5173
npm run build    # comprobación de tipos + compilación en dist/
```

Navegación: `#inicio`, `#carpetas`, `#recuperacion`, `#actividad`, `#equipo`.

## Siguiente paso
Conectar `NexusService` a un servicio local en Rust que use [`nexus-envelope`](../crates/nexus-envelope/) para cifrar
y descifrar de verdad, y empaquetarlo como aplicación de Windows (Tauri).
