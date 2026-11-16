import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La CSP definitiva la fijará el contenedor de escritorio (Tauri) en la Fase 2.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
