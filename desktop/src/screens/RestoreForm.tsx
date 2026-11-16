import { useState, type FormEvent } from 'react';
import type { Compartment, NexusService, RestoreResult } from '../service/types';
import { Icon } from '../components/Icon';
import s from './screens.module.css';

const pad = (n: number) => String(n).padStart(2, '0');
const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const etiqueta = (d: Date) =>
  d.toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

type Props = { service: NexusService; compartments: Compartment[]; initialId?: string };

/** Recuperación en la versión real: carpeta + instante. Windows Hello lo pide el servicio (Rust). */
export function RestoreForm({ service, compartments, initialId }: Props) {
  const [id, setId] = useState(initialId ?? compartments[0]?.id ?? '');
  const [when, setWhen] = useState(() => toInput(new Date(Date.now() - 60 * 60 * 1000)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RestoreResult | null>(null);
  const comp = compartments.find((c) => c.id === id);
  const at = new Date(when);
  const valid = comp && !Number.isNaN(at.getTime());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await service.restoreAt(id, at, etiqueta(at)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1>Recuperación</h1>
          <p>Elige una carpeta y el momento al que quieres volver. Lo recuperado se guarda en una carpeta nueva dentro de Documentos; lo actual no se toca.</p>
        </div>
      </header>

      <div className={s.ai}>
        <form className={`panel ${s.conversation} ${s.restoreForm}`} onSubmit={submit} aria-label="Recuperar una carpeta">
          <label htmlFor="rf-carpeta">Carpeta
            <select id="rf-carpeta" value={id} onChange={(e) => setId(e.target.value)}>
              {compartments.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label htmlFor="rf-cuando">Estado al
            <input id="rf-cuando" type="datetime-local" value={when} max={toInput(new Date())} onChange={(e) => setWhen(e.target.value)} />
          </label>
          {valid && (
            <div className={s.plan}>
              <span className="eyebrow">Qué va a pasar</span>
              <p>
                Se recuperarán los archivos de «{comp.nombre}» tal como estaban el {etiqueta(at)}. Windows te pedirá tu huella,
                rostro o PIN antes de descifrar nada.
              </p>
            </div>
          )}
          <div className={s.detailActions}>
            <button type="submit" className="btn btn-primary" disabled={!valid || busy}>
              <Icon name="hello" size={18} />{busy ? 'Esperando a Windows Hello…' : 'Recuperar con Windows Hello'}
            </button>
          </div>
          {error && <p className={s.error} role="alert">{error}</p>}
          {result && (
            <div className={s.done}>
              <Icon name="check" size={20} />
              <div>
                <b>{result.restaurados} archivo{result.restaurados === 1 ? '' : 's'} recuperado{result.restaurados === 1 ? '' : 's'} en «{result.carpeta}».</b>
                <p>
                  {result.noPresentes ? `${result.noPresentes} archivo(s) aún no existían en ese momento. ` : ''}
                  Las versiones actuales no se modificaron y la operación quedó en el registro de actividad.
                </p>
                {result.ubicacion && service.reveal && (
                  <button type="button" className="btn btn-secondary" onClick={() => void service.reveal!(result.ubicacion!)}>
                    Abrir la carpeta recuperada
                  </button>
                )}
              </div>
            </div>
          )}
        </form>

        <aside className={`panel ${s.rules}`} aria-label="Cómo protege tus datos">
          <h3>Así funciona la recuperación</h3>
          <ol>
            <li>Eliges la carpeta y el momento. La ayuda de CIPHER AI para preparar recuperaciones llegará en una versión posterior.</li>
            <li>Windows Hello confirma que eres tú. La confirmación la pide el motor de NEXUS, no esta pantalla.</li>
            <li>La llave de la carpeta se desbloquea con el TPM de este equipo y se descifra aquí mismo.</li>
            <li>Lo recuperado va a una carpeta nueva: nada se sobrescribe.</li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
