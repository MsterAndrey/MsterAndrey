import { NexusLogo } from '../Logo/Logo';
import styles from './Footer.module.css';

const COLS = [
  {
    title: 'Plataforma',
    links: [
      { href: '#plataforma', label: 'Arquitectura' },
      { href: '#seguridad', label: 'Seguridad' },
      { href: '#tecnologia', label: 'Tecnología' },
    ],
  },
  {
    title: 'CIPHER AI',
    links: [
      { href: '#cipher-ai', label: 'Visión general' },
      { href: '#/cipher-ai', label: 'Demostración' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '#/marca', label: 'Sistema de marca' },
      { href: '#acceso', label: 'Solicitar acceso' },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <NexusLogo height={32} />
          <p className={styles.descriptor}>Advanced Cybersecurity Infrastructure</p>
          <p className={styles.slogan}>Security must be engineered, not promised.</p>
        </div>
        <nav className={styles.cols} aria-label="Pie de página">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className={styles.colTitle}>{c.title}</p>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} NEXUS CUBE. Proyecto en fase de diseño y desarrollo.</p>
        <p>Sitio de presentación independiente del sistema. No recopila datos ni usa cookies.</p>
      </div>
    </footer>
  );
}
