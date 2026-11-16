import { useState, type FormEvent } from 'react';
import type { NexusService, PendingAction, RestorePlan, RestoreResult } from '../service/types';
import { CipherCore } from '../components/CipherCore/CipherCore';
import { HelloDialog } from '../components/HelloDialog';
import { Icon } from '../components/Icon';
import { RestoreForm } from './RestoreForm';
import type { Compartment } from '../service/types';
import s from './screens.module.css';

const STEPS = ['Analizando la petición…', 'Consultando el historial de versiones…', 'Preparando el plan de recuperación…'];

type Phase =
  | { k: 'idle' }
  | { k: 'thinking'; step: number }
  | { k: 'plan'; plan: RestorePlan }
  | { k: 'confirming'; plan: RestorePlan; action: PendingAction }
  | { k: 'restoring'; plan: RestorePlan }
  | { k: 'done'; plan: RestorePlan; result: RestoreResult };

type Props = { service: NexusService; initial?: string; compartments: Compartment[]; initialId?: string };

export function Recovery(props: Props) {
  if (props.service.modo === 'real') {
    return <RestoreForm service={props.service} compartments={props.compartments} initialId={props.initialId} />;
  }
  return <AiRecovery service={props.service} initial={props.initial} />;
}

function AiRecovery({ service, initial }: { service: NexusService; initial?: string }) {
  const [phase, setPhase] = useState<Phase>({ k: 'idle' });
  const [pregunta, setPregunta] = useState<string | null>(null);
  const [draft, setDraft] = useState(initial ?? '');

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || phase.k === 'thinking') return;
    setPregunta(q);
    setDraft('');
    for (let i = 0; i < STEPS.length; i++) {
      setPhase({ k: 'thinking', step: i });
      await new Promise((r) => setTimeout(r, 650));
    }
    const plan = await service.proposeRestore(q);
    setPhase({ k: 'plan', plan });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(draft);
  };

  const confirm = async (plan: RestorePlan) => {
    const action = await service.prepareRestore(plan);
    setPhase({ k: 'confirming', plan, action });
  };

  const plan = phase.k === 'plan' || phase.k === 'confirming' || phase.k === 'restoring' || phase.k === 'done' ? phase.plan : null;

  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1>Recuperación</h1>
          <p>Describe qué quieres recuperar. CIPHER AI prepara el plan; tú lo confirmas con Windows Hello y la aplicación lo ejecuta en este equipo.</p>
        </div>
      </header>

      <div className={s.ai}>
        <section className={`panel ${s.conversation}`} aria-label="Conversación con CIPHER AI" aria-live="polite">
          <div className={s.aiHead}>
            <CipherCore size={36} state={phase.k === 'thinking' || phase.k === 'restoring' ? 'processing' : 'idle'} />
            <div>
              <h2>CIPHER AI</h2>
              <small>Respuestas de ejemplo · datos ficticios</small>
            </div>
          </div>

          {!pregunta && (
            <div className={s.bubbleAi}>
              <p>Hola. Puedo ayudarte a recuperar archivos o versiones anteriores de tus carpetas. Por ejemplo:</p>
              <div className={s.suggest}>
                {[
                  'Recupera el contrato del Caso 2026-114 como estaba ayer a las 6 de la tarde',
                  'Necesito la versión del viernes del anexo de inventario',
                ].map((t) => (
                  <button key={t} type="button" onClick={() => void ask(t)}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {pregunta && <p className={s.bubbleUser}>{pregunta}</p>}

          {phase.k === 'thinking' && (
            <p className={s.status} role="status"><CipherCore size={20} state="processing" />{STEPS[phase.step]}</p>
          )}

          {plan && (
            <div className={s.bubbleAi}>
              <p>Encontré lo que buscas. Este es el plan; nada cambiará hasta que lo confirmes:</p>
              <div className={s.plan}>
                <div className={s.planHead}>
                  <span className="eyebrow">Plan de recuperación</span>
                  <span className="chip chip-ai">Propuesto por CIPHER AI</span>
                </div>
                <div className={s.planMeta}>
                  <span><b>Carpeta:</b> {plan.compartimento}</span>
                  <span><b>Estado al:</b> {plan.puntoEnElTiempo}</span>
                  <span><b>Destino:</b> {plan.destino}</span>
                </div>
                <ul className={s.planList}>
                  {plan.archivos.map((f) => (
                    <li key={f.nombre}><Icon name="file" size={16} /><span>{f.nombre}<small>{f.cambio}</small></span></li>
                  ))}
                </ul>
                {phase.k === 'plan' && (
                  <div className={s.detailActions}>
                    <button type="button" className="btn btn-primary" onClick={() => void confirm(plan)}>
                      <Icon name="hello" size={18} />Confirmar con Windows Hello
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setPhase({ k: 'idle' }); setPregunta(null); }}>Descartar</button>
                  </div>
                )}
              </div>
              {phase.k === 'restoring' && (
                <p className={s.status} role="status"><CipherCore size={20} state="processing" />Descifrando en este equipo…</p>
              )}
              {phase.k === 'done' && (
                <div className={s.done}>
                  <Icon name="check" size={20} />
                  <div>
                    <b>{phase.result.restaurados} archivos recuperados en «{phase.result.carpeta}».</b>
                    <p>Las versiones actuales no se modificaron. La operación quedó registrada en NEXUS TRUST (recibo <span className="mono">#{phase.result.recibo}</span>).</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <form className={s.composer} onSubmit={onSubmit}>
            <label htmlFor="rec-input" className="visually-hidden">Qué quieres recuperar</label>
            <input
              id="rec-input"
              value={draft}
              maxLength={300}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ej.: recupera los archivos de Constructora Andina de ayer"
              disabled={phase.k === 'thinking' || phase.k === 'restoring'}
            />
            <button type="submit" className="btn btn-primary" disabled={!draft.trim()} aria-label="Enviar">
              <Icon name="send" size={16} />
            </button>
          </form>
        </section>

        <aside className={`panel ${s.rules}`} aria-label="Cómo protege tus datos">
          <h3>Así funciona la recuperación</h3>
          <ol>
            <li>CIPHER AI entiende tu petición y propone un plan. No tiene acceso a tus llaves ni al contenido de los archivos.</li>
            <li>Tú revisas el plan y lo confirmas con tu huella o tu rostro en Windows Hello.</li>
            <li>La aplicación usa la llave guardada en el TPM de este equipo y descifra aquí mismo.</li>
            <li>Lo recuperado va a una carpeta nueva: nada se sobrescribe y todo queda registrado.</li>
          </ol>
        </aside>
      </div>

      {phase.k === 'confirming' && (
        <HelloDialog
          motivo={phase.action.descripcion}
          huella={phase.action.huella}
          onCancel={() => setPhase({ k: 'plan', plan: phase.plan })}
          onConfirm={async () => {
            const p = phase.plan;
            const action = phase.action;
            setPhase({ k: 'restoring', plan: p });
            const result = await service.confirmWithWindowsHello(action);
            setPhase({ k: 'done', plan: p, result });
          }}
        />
      )}
    </div>
  );
}
