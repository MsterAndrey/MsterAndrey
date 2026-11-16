import { useEffect } from 'react';
import { parseRoute } from '../app/useHashRoute';
import { Access } from '../components/Access/Access';
import { Architecture } from '../components/Architecture/Architecture';
import { CipherFab } from '../components/CipherFab/CipherFab';
import { CipherSection } from '../components/CipherSection/CipherSection';
import { Footer } from '../components/Footer/Footer';
import { Hero } from '../components/Hero/Hero';
import { Navbar } from '../components/Navbar/Navbar';
import { Security } from '../components/Security/Security';

export function LandingPage() {
  // Al volver desde otra página con un ancla (#seguridad…), desplazarse a ella.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && parseRoute(window.location.hash) === 'landing') {
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    }
  }, []);

  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <Navbar />
      <main id="contenido">
        <Hero />
        <Architecture />
        <Security />
        <CipherSection />
        <Access />
      </main>
      <Footer />
      <CipherFab />
    </>
  );
}
