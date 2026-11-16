import type { ActivityEvent, Compartment, DeviceStatus } from '../service/types';
import { CipherCore } from '../components/CipherCore/CipherCore';
import { Icon } from '../components/Icon';
import type { View } from '../components/Shell';
import s from './screens.module.css';

type Props = {
  usuario: string;
  device: DeviceStatus;
  compartments: Compartment[];
  activity: ActivityEvent[];
  onNavigate: (v: View) => void;
};

export function Home({ usuario, device, compartments, activity, onNavigate }: Props) {
  const avisos = device.checks.filter((c) => c.estado === 'accion' || c.estado === 'bloqueante');
  const aprobaciones = activity.filter((a) => a.categoria === 'aprobacion').length;
  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1>Hola, {usuario.split(' ')[0]}</h1>
          <p>Tus carpetas están cifradas en este equipo y cada cambio se guarda como una versión nueva que no se puede sobrescribir.</p>
        </div>
      </header>

      <section className={s.summary} aria-label="Resumen">
        <div className={`panel ${s.stat}`}>
          <span className={s.k}><Icon name="shield" size={16} />Este equipo</span>
          <strong>{avisos.length === 0 ? 'Protegido' : `${avisos.length} aviso${avisos.length === 1 ? '' : 's'}`}</strong>
          <span>{avisos[0]?.titulo ?? 'Todo en orden'}</span>
        </div>
        <div className={`panel ${s.stat}`}>
          <span className={s.k}><Icon name="folderLock" size={16} />Carpetas protegidas</span>
          <strong>{compartments.length} carpeta{compartments.length === 1 ? '' : 's'}</strong>
          <span>Cada una con su propia llave</span>
        </div>
        <div className={`panel ${s.stat}`}>
          <span className={s.k}><Icon name="cloud" size={16} />Copia de seguridad</span>
          <strong>{device.ultimaSincronizacion}</strong>
          <span>Versiones inmutables</span>
        </div>
        <div className={`panel ${s.stat}`}>
          <span className={s.k}><Icon name="approve" size={16} />{aprobaciones > 0 ? 'Aprobaciones' : 'Actividad'}</span>
          <strong>{aprobaciones > 0 ? `${aprobaciones} pendiente${aprobaciones === 1 ? '' : 's'}` : `${activity.length} eventos`}</strong>
          <span>{aprobaciones > 0 ? 'Exportación de una carpeta' : 'Registro verificable'}</span>
        </div>
      </section>

      <div className={`panel ${s.aiCard}`}>
        <CipherCore size={44} />
        <div>
          <h2>¿Perdiste un cambio o un archivo?</h2>
          <p>Pídeselo a CIPHER AI: prepara la recuperación y tú la confirmas con Windows Hello.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => onNavigate('recuperacion')}>Recuperar archivos</button>
      </div>

      <div className={s.cols}>
        <section className={`panel ${s.section}`}>
          <div className={s.sectionHead}>
            <h2>Tus carpetas</h2>
            <button type="button" className={s.textLink} onClick={() => onNavigate('carpetas')}>Ver todas</button>
          </div>
          {compartments.slice(0, 3).map((c) => (
            <div key={c.id} className={s.row}>
              <span className={s.rowIcon}><Icon name="folderLock" size={18} /></span>
              <span className={s.rowText}>
                <b>{c.nombre}</b>
                <small>{c.archivos} archivos · copia {c.ultimaCopia}</small>
              </span>
              <StateChip estado={c.estado} />
            </div>
          ))}
        </section>
        <section className={`panel ${s.section}`}>
          <div className={s.sectionHead}>
            <h2>Actividad reciente</h2>
            <button type="button" className={s.textLink} onClick={() => onNavigate('actividad')}>Ver registro</button>
          </div>
          {activity.slice(0, 4).map((a) => (
            <div key={a.id} className={s.row}>
              <span className={s.rowText}>
                <b>{a.que}</b>
                <small>{a.cuando} · {a.quien}</small>
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function StateChip({ estado }: { estado: Compartment['estado'] }) {
  if (estado === 'protegida') return <span className="chip chip-ok">Protegida</span>;
  if (estado === 'sincronizando') return <span className="chip chip-info">Sincronizando</span>;
  return <span className="chip chip-neutral">Solo lectura</span>;
}
