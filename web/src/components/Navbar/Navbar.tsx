import { useEffect, useState } from 'react';
import { NexusLogo } from '../Logo/Logo';
import { Icon } from '../Icons/Icon';
import styles from './Navbar.module.css';

export const NAV_LINKS = [
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#tecnologia', label: 'Tecnología' },
  { href: '#seguridad', label: 'Seguridad' },
  { href: '#cipher-ai', label: 'CIPHER AI' },
  { href: '#marca', label: 'Documentación' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 960 && setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={styles.header} data-scrolled={scrolled || open} data-open={open}>
      <nav className={`container ${styles.nav}`} aria-label="Principal">
        <a href="#inicio" className={styles.brand} onClick={close} aria-label="NEXUS CUBE — inicio">
          <NexusLogo height={30} decorative />
        </a>

        <ul className={styles.links}>
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={styles.link}>{l.label}</a>
            </li>
          ))}
        </ul>

        <a href="#acceso" className={styles.access}>
          Acceso
        </a>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
      </nav>

      <div id="mobile-menu" className={styles.mobile} hidden={!open}>
        <ul className="container">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={close}>{l.label}</a>
            </li>
          ))}
          <li>
            <a href="#acceso" onClick={close} className={styles.mobileAccess}>Solicitar acceso</a>
          </li>
        </ul>
      </div>
    </header>
  );
}
