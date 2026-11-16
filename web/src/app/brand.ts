/** URLs de los SVG de marca (generados por scripts/build-brand.mjs en public/brand). */
const base = import.meta.env.BASE_URL;

export const brand = (file: string) => `${base}brand/${file}`;

/**
 * Correo oficial para solicitudes de acceso.
 * PENDIENTE: reemplazar por el dominio definitivo antes de publicar (ver README).
 */
export const ACCESS_EMAIL = 'acceso@nexuscube.example';
