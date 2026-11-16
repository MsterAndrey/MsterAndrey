import { useEffect, useState } from 'react';

export type Route = 'landing' | 'cipher-ai' | 'marca';

/**
 * Rutas con anclas simples (`#demo-cipher-ai`, `#marca`), compatibles con cualquier
 * alojamiento estático. Cualquier otro hash es un ancla dentro de la página principal.
 */
export const ROUTE_HASHES: Record<Exclude<Route, 'landing'>, string> = {
  'cipher-ai': '#demo-cipher-ai',
  marca: '#marca',
};

export function parseRoute(hash: string): Route {
  if (hash === ROUTE_HASHES['cipher-ai']) return 'cipher-ai';
  if (hash === ROUTE_HASHES.marca) return 'marca';
  return 'landing';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
