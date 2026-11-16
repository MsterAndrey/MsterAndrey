/** URLs de los SVG de marca (generados por scripts/build-brand.mjs en public/brand). */
const base = import.meta.env.BASE_URL;

export const brand = (file: string) => `${base}brand/${file}`;

/**
 * Correo oficial para solicitudes de acceso (dominio nexuscube.com.co).
 * IMPORTANTE: registrar el dominio y configurar SPF, DKIM y DMARC antes de publicar el sitio.
 */
export const ACCESS_EMAIL = 'acceso@nexuscube.com.co';
