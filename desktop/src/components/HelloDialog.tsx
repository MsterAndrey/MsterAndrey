import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import styles from './HelloDialog.module.css';

type Props = {
  /** Qué se va a autorizar, tal cual se firma. */
  motivo: string;
  huella?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

/**
 * Representación de la ventana de Windows Hello.
 * PROTOTIPO: aquí no hay biometría. En el producto, esta ventana la muestra Windows
 * (no la aplicación) y la confirmación firma la huella (hash) de la acción.
 */
export function HelloDialog({ motivo, huella, onConfirm, onCancel }: Props) {
  const [state, setState] = useState<'esperando' | 'verificando'>('esperando');
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && state === 'esperando' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, state]);

  const confirm = async () => {
    setState('verificando');
    await onConfirm();
  };

  return (
    <div className={styles.scrim}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="hello-title">
        <p className={styles.sim}>Simulación · en el producto real esta ventana la muestra Windows</p>
        <div className={styles.head}>
          <span className={styles.badge}><Icon name="hello" size={28} /></span>
          <div>
            <h2 id="hello-title">Windows Hello</h2>
            <p className={styles.sub}>Confirma que eres tú</p>
          </div>
        </div>
        <div className={styles.what}>
          <span className="eyebrow">Vas a autorizar</span>
          <p>{motivo}</p>
          {huella && <p className={`mono ${styles.hash}`}>Huella de la acción: {huella}</p>}
        </div>
        <div className={styles.sensor} data-state={state} aria-live="polite">
          <Icon name="hello" size={40} />
          <span>{state === 'esperando' ? 'Coloca tu dedo en el lector o mira a la cámara' : 'Verificando…'}</span>
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={state === 'verificando'}>Cancelar</button>
          <button ref={btn} type="button" className="btn btn-primary" onClick={confirm} disabled={state === 'verificando'}>
            Simular verificación
          </button>
        </div>
      </div>
    </div>
  );
}
