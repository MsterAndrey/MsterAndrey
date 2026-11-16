import { useEffect, useState } from 'react';

export type Route = 'landing' | 'cipher-ai' | 'marca';

/** Rutas con "#/…"; cualquier otro hash es un ancla dentro de la página principal. */
function parse(hash: string): Route {
  if (hash.startsWith('#/cipher-ai')) return 'cipher-ai';
  if (hash.startsWith('#/marca')) return 'marca';
  return 'landing';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
