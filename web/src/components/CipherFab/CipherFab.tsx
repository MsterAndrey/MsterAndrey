import { useEffect, useState } from 'react';
import { CipherCore } from '../CipherCore/CipherCore';
import styles from './CipherFab.module.css';

/** Botón flotante hacia la demostración de CIPHER AI. Aparece tras pasar el hero. */
export function CipherFab() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a href="#/cipher-ai" className={styles.fab} data-show={show} tabIndex={show ? 0 : -1} aria-hidden={!show} aria-label="Abrir la demostración de CIPHER AI">
      <CipherCore size={30} animated={show} />
      <span className={styles.label}>CIPHER AI</span>
    </a>
  );
}
