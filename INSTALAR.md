# Cómo descargar y probar NEXUS CUBE en tu computador

Guía paso a paso para Windows. No necesitas saber programar para los pasos 1 a 3.

> Recuerda: esto es un **prototipo**. No lo uses con información real de clientes.

---

## 1. Descargar el proyecto

**Opción A, sin instalar nada:**
1. Entra en https://github.com/MsterAndrey/MsterAndrey con tu cuenta.
2. Arriba a la izquierda, elige la rama **`main`**.
3. Pulsa el botón verde **Code** y luego **Download ZIP**.
4. Descomprime el archivo, por ejemplo en `C:\NexusCube`.

**Opción B, con Git** (recomendada si vas a seguir trabajando en el proyecto):
1. Instala Git desde https://git-scm.com/download/win
2. Abre PowerShell y ejecuta:
   ```powershell
   cd C:\
   git clone https://github.com/MsterAndrey/MsterAndrey.git NexusCube
   ```
   Para recibir cambios más adelante: `cd C:\NexusCube` y luego `git pull`.

---

## 2. Ver la página web y la demo de CIPHER AI

1. Instala **Node.js 20 o superior** (versión LTS) desde https://nodejs.org
2. Abre PowerShell y ejecuta:
   ```powershell
   cd C:\NexusCube\web
   npm install
   npm run dev
   ```
3. Abre en el navegador: **http://localhost:5173**
   - Página principal: `http://localhost:5173/`
   - Demo de CIPHER AI: `http://localhost:5173/#demo-cipher-ai`
   - Sistema de marca y logotipos: `http://localhost:5173/#marca`
4. Para detenerla, vuelve a PowerShell y pulsa `Ctrl + C`.

---

## 3. Probar la herramienta de diagnóstico TPM en tu PC

**Descargar el `.exe`, compilado automáticamente por GitHub:**
1. En el repositorio, abre la pestaña **Actions**.
2. Entra en la ejecución más reciente de **CI** con marca verde ✔ en la rama `main`.
3. Abajo, en **Artifacts**, descarga **nexus-diagnostico-windows** y descomprímelo.

**Ejecutarla:**
1. Haz **doble clic** en `nexus-diagnostico.exe`.
2. Windows te pedirá permiso de administrador: acepta (es necesario para leer el TPM, Secure Boot y BitLocker).
3. Se abrirá en tu navegador el **informe visual** con el veredicto (APTO, APTO CON ACCIONES, NO APTO o INCOMPLETO) y qué hacer en cada punto. El informe queda guardado en la misma carpeta (`.html` y `.json`).

Windows puede mostrar una advertencia de SmartScreen porque el programa **todavía no está firmado** digitalmente. Es normal en esta fase: sólo ejecútalo si lo descargaste tú mismo desde la pestaña Actions de tu repositorio.

Envíame una captura del informe o el texto de la ventana: sería la **primera prueba en un equipo físico** y la registraría en los resultados.

---

## 4. (Opcional) Ejecutar las pruebas del código en Rust

1. Instala Rust desde https://rustup.rs. En Windows también pedirá instalar «Visual Studio Build Tools», con la opción «Desarrollo de escritorio con C++».
2. En PowerShell:
   ```powershell
   cd C:\NexusCube
   cargo test
   ```
   Deberían pasar todas las pruebas.

---

## Problemas frecuentes

| Problema | Solución |
|---|---|
| `npm` no se reconoce | Cierra y vuelve a abrir PowerShell después de instalar Node.js |
| `npm run dev` dice que el puerto está ocupado | Usa la dirección que aparezca en pantalla (p. ej. `http://localhost:5174`) |
| La herramienta TPM dice INCOMPLETO | Ejecútala en PowerShell **como administrador** |
| PowerShell no deja ejecutar el `.exe` | Haz clic derecho en el archivo → Propiedades → marca «Desbloquear» → Aceptar |
