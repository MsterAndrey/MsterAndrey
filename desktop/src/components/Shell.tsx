import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Shell.module.css';

export type View = 'inicio' | 'carpetas' | 'recuperacion' | 'actividad' | 'equipo';

export const VIEWS: Array<{ id: View; label: string; icon: IconName }> = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'carpetas', label: 'Carpetas protegidas', icon: 'folderLock' },
  { id: 'recuperacion', label: 'Recuperación', icon: 'restore' },
  { id: 'actividad', label: 'Actividad', icon: 'activity' },
  { id: 'equipo', label: 'Este equipo', icon: 'device' },
];

type Props = {
  modo: 'demostracion' | 'real';
  view: View;
  onNavigate: (v: View) => void;
  usuario: string;
  organizacion: string;
  onLock: () => void;
  children: ReactNode;
};

export function Shell({ modo, view, onNavigate, usuario, organizacion, onLock, children }: Props) {
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="./brand/nexus-cube-isotipo.svg" alt="" width={28} height={28} />
          <span>NEXUS <b>CUBE</b></span>
        </div>
        <nav aria-label="Secciones">
          <ul className={styles.nav}>
            {VIEWS.map((v) => (
              <li key={v.id}>
                <a
                  href={`#${v.id}`}
                  className={styles.link}
                  aria-current={view === v.id ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(v.id);
                  }}
                >
                  <Icon name={v.icon} size={19} />
                  <span>{v.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">{usuario.slice(0, 1)}</span>
          <div className={styles.userText}>
            <span>{usuario}</span>
            <small>{organizacion}</small>
          </div>
          <button type="button" className={styles.lockBtn} onClick={onLock} aria-label="Bloquear NEXUS CUBE" title="Bloquear">
            <Icon name="lock" size={18} />
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <p className={styles.proto} role="note">
          <Icon name="info" size={15} />
          {modo === 'real'
            ? 'Versión preliminar sin auditar: cifrado real con llaves en el TPM. Úsala sólo con archivos de prueba.'
            : 'Prototipo de interfaz: datos ficticios, Windows Hello simulado y sin cifrado real.'}
        </p>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
