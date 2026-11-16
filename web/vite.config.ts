import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Inyecta una Content-Security-Policy estricta sólo en el build de producción
 * (en desarrollo Vite necesita estilos en línea). Las cabeceras que no se pueden
 * fijar con <meta> (frame-ancestors, HSTS…) deben configurarse en el hosting: ver README.
 */
function cspPlugin(): Plugin {
  const policy = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'none'",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
  return {
    name: 'nexus-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin()],
  build: { target: 'es2022', sourcemap: false, assetsInlineLimit: 0 },
});
