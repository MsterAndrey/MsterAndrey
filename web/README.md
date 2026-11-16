# NEXUS CUBE — Sitio de presentación y demostración de CIPHER AI

Sitio **estático e independiente** del sistema NEXUS CUBE (ver [ADR-0010](../docs/adr/ADR-0010-web-independiente-distribucion-controlada.md)):
no tiene inicio de sesión ni API, no ofrece descargas, no usa cookies y no recopila datos.
La demostración de CIPHER AI usa **respuestas predefinidas con datos ficticios**: no hay ningún modelo de IA ni ninguna conexión con sistemas.

## Ejecutar

Requisitos: Node.js 20 o superior.

```bash
cd web
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # comprobación de tipos + build de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173
npm run brand      # regenera los logotipos SVG en public/brand/
```

Rutas: `#/` (página principal), `#/cipher-ai` (demostración de la IA), `#/marca` (sistema de marca y descargas).

## Estructura

```
web/
├── scripts/build-brand.mjs      Generador de todos los logotipos (geometría y wordmark propios)
├── public/
│   ├── brand/                   Logotipos SVG generados (fuente única, descargables)
│   ├── favicon.svg, app-icon.svg
├── src/
│   ├── app/                     App, enrutado por hash, rutas de marca
│   ├── components/
│   │   ├── Navbar/  Hero/  Architecture/  Security/  CipherSection/  Access/  Footer/
│   │   ├── CubeAnimation/       Cubo 3D en CSS (sin WebGL)
│   │   ├── CipherCore/          Núcleo animado de CIPHER AI (reposo / procesando)
│   │   ├── CipherChat/          Interfaz conversacional
│   │   ├── CipherFab/           Botón flotante
│   │   ├── Logo/  Icons/  Button/  Reveal/  SectionHeader/
│   ├── data/                    Contenido: módulos, principios, guiones de la demo
│   ├── hooks/                   useInView, usePrefersReducedMotion
│   ├── pages/                   LandingPage, CipherAIPage, BrandPage
│   ├── styles/                  tokens.css (sistema de diseño), global.css
│   └── animations/              reveal.css
```

## Decisiones técnicas

| Decisión | Motivo |
|---|---|
| React + TypeScript + Vite, **sin librerías de animación** | Las animaciones son de transform y opacity en CSS. Framer Motion no aportaría nada que justifique su peso |
| Cubo en **CSS 3D** en lugar de Three.js/WebGL | Unos pocos KB frente a más de 600 KB; funciona en móviles modestos |
| Logotipos como **SVG independientes** generados por script | Una sola fuente de verdad. El wordmark usa letras geométricas propias, así que no depende de ninguna fuente instalada |
| Fuentes Inter y JetBrains Mono **autoalojadas** | Ninguna petición a terceros; compatible con una CSP estricta |
| Enrutado por **hash** | Funciona en cualquier hosting estático sin reglas de reescritura |
| CSS Modules | Estilos aislados por componente, sin dependencias |

## Rendimiento y accesibilidad

- Las animaciones del cubo se **pausan fuera de pantalla** (IntersectionObserver).
- Con `prefers-reduced-motion: reduce`, todo queda estático: cubo, núcleo, apariciones y flujos.
- Las páginas de demostración y de marca se cargan bajo demanda (`lazy`).
- Navegación por teclado completa, enlace "saltar al contenido", foco visible y contraste AA en el texto.

## Seguridad del frontend

- **CSP estricta** inyectada en el build (`vite.config.ts`): `default-src 'none'`, scripts y estilos sólo desde el mismo origen y `connect-src 'none'`.
- Sin `dangerouslySetInnerHTML`: todo el contenido dinámico se renderiza como texto escapado por React.
- Sin secretos, claves de API ni credenciales en el código. La demo no hace peticiones de red.
- No hay autenticación ni biometría simuladas: el acceso se solicita por correo (proceso de [docs/18](../docs/18-distribucion-segura.md)).

### Cabeceras que debe añadir el hosting
Una etiqueta `<meta>` no puede fijar estas cabeceras; hay que configurarlas en el servidor o CDN:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Content-Security-Policy: frame-ancestors 'none'   (además de la política del <meta>)
Cross-Origin-Opener-Policy: same-origin
```

## Pendiente antes de publicar
- Sustituir el correo provisional `acceso@nexuscube.example` en `src/app/brand.ts` por el correo oficial, con SPF, DKIM y DMARC configurados.
- Revisión legal de los textos (afirmaciones, privacidad).
- Validar los logotipos con un diseñador y hacer una búsqueda de marcas registradas antes de registrar el nombre y el símbolo.
