import type { DeviceStatus } from '../service/types';
import s from './screens.module.css';

const LABEL = { ok: 'Correcto', accion: 'Requiere acción', bloqueante: 'Bloqueante', desconocido: 'Sin datos' } as const;

export function Device({ device }: { device: DeviceStatus }) {
  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1>Este equipo</h1>
          <p>
            <span className="mono">{device.equipo}</span> · {device.windows}. NEXUS CUBE sólo entrega claves a equipos que demuestran,
            mediante el TPM, que arrancaron sin manipulaciones.
          </p>
        </div>
      </header>
      <section className={`panel ${s.section}`} aria-label="Comprobaciones de seguridad">
        <ul className={s.checks}>
          {device.checks.map((c) => (
            <li key={c.id} className={s.check}>
              <b>{c.titulo}</b>
              <span className={`chip chip-${c.estado}`}>{LABEL[c.estado]}</span>
              <p>{c.detalle}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className={`panel ${s.section}`} aria-label="Sin conexión">
        <div className={s.sectionHead}><h2>Trabajo sin conexión</h2></div>
        <p className={s.rowText}>
          Si este equipo pierde la conexión, podrás seguir abriendo tus carpetas durante 7 días. Si el equipo se pierde o lo roban,
          un administrador puede revocarlo y sus claves dejan de servir al reconectarse.
        </p>
      </section>
    </div>
  );
}
