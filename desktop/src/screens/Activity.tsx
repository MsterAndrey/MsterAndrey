import { useState } from 'react';
import type { ActivityEvent, NexusService } from '../service/types';
import { Icon, type IconName } from '../components/Icon';
import s from './screens.module.css';

const ICONS: Record<ActivityEvent['categoria'], IconName> = {
  acceso: 'file', copia: 'cloud', aprobacion: 'approve', integridad: 'tree', seguridad: 'shield',
};

export function Activity({ service, activity }: { service: NexusService; activity: ActivityEvent[] }) {
  const [state, setState] = useState<'idle' | 'checking' | { checkpoint: number; testigos: string }>('idle');
  const verify = async () => {
    setState('checking');
    setState(await service.verifyAuditLog());
  };
  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1>Actividad</h1>
          <p>Cada acceso, copia y aprobación queda en un registro que nadie puede borrar sin dejar rastro, ni siquiera un administrador.</p>
        </div>
      </header>

      <div className={`panel ${s.verify}`}>
        <span className={s.rowIcon}><Icon name="tree" size={18} /></span>
        <p>
          {state === 'idle' && 'Comprueba que el registro no ha sido alterado. La verificación se hace en este equipo.'}
          {state === 'checking' && 'Verificando pruebas de consistencia y firmas de los testigos…'}
          {typeof state === 'object' && (
            <>Registro íntegro: punto de control <span className="mono">#{state.checkpoint}</span> verificado por {state.testigos} testigos.</>
          )}
        </p>
        {typeof state === 'object'
          ? <span className="chip chip-ok"><Icon name="check" size={14} />Verificado</span>
          : <button type="button" className="btn btn-secondary" onClick={() => void verify()} disabled={state === 'checking'}>Verificar integridad</button>}
      </div>

      <section className={`panel ${s.section}`} aria-label="Eventos">
        <ul className={s.events}>
          {activity.map((a) => (
            <li key={a.id} className={s.event}>
              <span className={s.rowIcon}><Icon name={ICONS[a.categoria]} size={18} /></span>
              <span className={s.rowText}>
                <b>{a.que}</b>
                <small>{a.cuando} · {a.quien}</small>
              </span>
              <span className={`mono ${s.receipt}`}>recibo #{a.recibo}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
