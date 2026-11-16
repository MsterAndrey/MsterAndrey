import { lazy, Suspense, useEffect } from 'react';
import { useHashRoute } from './useHashRoute';
import { LandingPage } from '../pages/LandingPage';

// Las páginas secundarias se cargan bajo demanda.
const CipherAIPage = lazy(() => import('../pages/CipherAIPage'));
const BrandPage = lazy(() => import('../pages/BrandPage'));

export function App() {
  const route = useHashRoute();

  useEffect(() => {
    if (route !== 'landing') window.scrollTo({ top: 0 });
  }, [route]);

  return (
    <Suspense fallback={<div aria-busy="true" style={{ minHeight: '100vh' }} />}>
      {route === 'cipher-ai' && <CipherAIPage />}
      {route === 'marca' && <BrandPage />}
      {route === 'landing' && <LandingPage />}
    </Suspense>
  );
}
