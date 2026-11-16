import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  INITIAL_CONVERSATIONS, PROCESSING_STEPS, SUGGESTIONS, newId, scriptedReply,
  type Conversation, type Message,
} from '../../data/cipherDemo';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { CipherCore } from '../CipherCore/CipherCore';
import { CipherLogo, NexusIsotipo } from '../Logo/Logo';
import { Icon } from '../Icons/Icon';
import { ChatMessage } from './ChatMessage';
import { ProcessingIndicator } from './ProcessingIndicator';
import styles from './CipherChat.module.css';

const MAX_LEN = 500;
const STEP_MS = 650;

export function CipherChat() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(INITIAL_CONVERSATIONS[0]!.id);
  const [step, setStep] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [drawer, setDrawer] = useState(false);
  const timers = useRef<number[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reduced = usePrefersReducedMotion();

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0]!;
  const processing = step !== null;

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' });
  }, [active.messages.length, step, reduced]);

  const append = useCallback((convId: string, msg: Message, title?: string) => {
    setConversations((cs) =>
      cs.map((c) => (c.id === convId ? { ...c, title: title ?? c.title, messages: [...c.messages, msg] } : c)),
    );
  }, []);

  const send = (raw: string) => {
    const text = raw.trim().slice(0, MAX_LEN);
    if (!text || processing) return;
    const convId = active.id;
    const isNew = active.messages.length === 0;
    append(
      convId,
      { id: newId('u'), role: 'user', blocks: [{ type: 'text', text }] },
      isNew ? (text.length > 34 ? `${text.slice(0, 34)}…` : text) : undefined,
    );
    setDraft('');
    setStep(0);
    PROCESSING_STEPS.forEach((_, i) => {
      if (i > 0) timers.current.push(window.setTimeout(() => setStep(i), i * STEP_MS));
    });
    timers.current.push(
      window.setTimeout(() => {
        append(convId, { id: newId('a'), role: 'assistant', blocks: scriptedReply(text) });
        setStep(null);
        timers.current = [];
      }, PROCESSING_STEPS.length * STEP_MS),
    );
  };

  const stop = () => {
    clearTimers();
    setStep(null);
    append(active.id, {
      id: newId('a'), role: 'assistant', blocks: [{ type: 'text', text: 'Solicitud detenida.' }],
    });
  };

  const selectConversation = (id: string) => {
    if (processing) {
      clearTimers();
      setStep(null);
    }
    setActiveId(id);
    setDrawer(false);
  };

  const newConversation = () => {
    const c: Conversation = { id: newId('c'), title: 'Nueva conversación', when: 'Ahora', messages: [] };
    setConversations((cs) => [c, ...cs]);
    selectConversation(c.id);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  // Altura automática del campo de entrada.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [draft]);

  return (
    <div className={styles.app} data-drawer={drawer}>
      {/* ── Barra superior ── */}
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setDrawer((v) => !v)}
          aria-expanded={drawer}
          aria-controls="chat-history"
          aria-label="Historial de conversaciones"
        >
          <Icon name="history" size={20} />
        </button>
        <a href="#cipher-ai" className={styles.home} aria-label="Volver a NEXUS CUBE">
          <NexusIsotipo height={24} decorative />
        </a>
        <span className={styles.sep} aria-hidden="true" />
        <div className={styles.identity}>
          <CipherLogo height={26} />
          <span className={styles.descriptor}>Intelligent Security Engine</span>
        </div>
        <div className={styles.topRight}>
          <span className={styles.activity} data-active={processing} role="status" aria-live="polite">
            <CipherCore size={18} state={processing ? 'processing' : 'idle'} animated={processing} />
            <span>{processing ? 'Procesando' : 'En espera'}</span>
          </span>
          <span className={styles.demoChip}>Demostración · datos ficticios</span>
        </div>
      </header>

      {/* ── Historial ── */}
      <aside id="chat-history" className={styles.sidebar} aria-label="Historial">
        <button type="button" className={styles.newBtn} onClick={newConversation}>
          <Icon name="plus" size={16} />
          Nueva conversación
        </button>
        <p className={styles.sideLabel}>Conversaciones</p>
        <ul className={styles.history}>
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={styles.histItem}
                aria-current={c.id === active.id ? 'true' : undefined}
                onClick={() => selectConversation(c.id)}
              >
                <span className={styles.histTitle}>{c.title}</span>
                <span className={styles.histWhen}>{c.when}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.sideNote}>
          <Icon name="info" size={14} />
          Respuestas predefinidas. Sin conexión con sistemas reales ni con un modelo de IA.
        </p>
      </aside>
      {drawer && <button type="button" className={styles.scrim} aria-label="Cerrar historial" onClick={() => setDrawer(false)} />}

      {/* ── Conversación ── */}
      <main className={styles.main} id="contenido">
        <div className={styles.thread} aria-live="polite">
          {active.messages.length === 0 && !processing ? (
            <div className={styles.empty}>
              <CipherCore size={112} />
              <h1 className={styles.emptyTitle}>¿Qué quieres analizar?</h1>
              <p className={styles.emptyText}>
                CIPHER AI interpreta eventos, correlaciona alertas y propone acciones. En esta demostración responde
                con datos ficticios.
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className={styles.suggestion} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <h1 className="visually-hidden">{active.title}</h1>
              {active.messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {processing && <ProcessingIndicator step={PROCESSING_STEPS[step]!} />}
            </>
          )}
          <div ref={endRef} />
        </div>

        <form className={styles.composer} onSubmit={onSubmit}>
          {active.messages.length > 0 && !processing && (
            <div className={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className={styles.chip} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className={styles.inputRow}>
            <label htmlFor="cipher-input" className="visually-hidden">Mensaje para CIPHER AI</label>
            <textarea
              id="cipher-input"
              ref={inputRef}
              className={styles.input}
              rows={1}
              maxLength={MAX_LEN}
              placeholder="Pregunta a CIPHER AI…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              spellCheck
            />
            {processing ? (
              <button type="button" className={styles.send} onClick={stop} aria-label="Detener">
                <Icon name="stop" size={18} />
              </button>
            ) : (
              <button type="submit" className={styles.send} disabled={!draft.trim()} aria-label="Enviar">
                <Icon name="send" size={18} />
              </button>
            )}
          </div>
          <p className={styles.disclaimer}>
            CIPHER AI puede equivocarse. Nunca ejecuta acciones por sí mismo: toda acción con efecto requiere la
            aprobación de una persona.
          </p>
        </form>
      </main>
    </div>
  );
}
