import { useState } from 'react';
import type { NexusService } from '../service/types';
import { HelloDialog } from '../components/HelloDialog';
import { Icon } from '../components/Icon';
import styles from './Lock.module.css';

export function Lock({ modo, onUnlock }: { modo: NexusService['modo']; onUnlock: () => Promise<void> }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const real = modo === 'real';
  const start = async () => {
    if (!real) return setAsking(true);
    setBusy(true);
    setError(null);
    try {
      await onUnlock();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };
  return (
    <main className={styles.lock}>
      <p className={styles.proto}>
        {real ? 'Versión preliminar · usar sólo con archivos de prueba' : 'Prototipo de interfaz · datos ficticios · Windows Hello simulado'}
      </p>
      <div className={styles.card}>
        <img src="./brand/nexus-cube-logo.svg" alt="NEXUS CUBE" height={40} width={195} />
        <div className={styles.text}>
          <h1>NEXUS CUBE está bloqueado</h1>
          <p>Tus carpetas protegidas siguen cifradas. Desbloquéalas con Windows Hello: tu huella o tu rostro se verifican en este equipo y nunca se envían.</p>
        </div>
        <button type="button" className={`btn btn-primary ${styles.cta}`} onClick={() => void start()} disabled={busy}>
          <Icon name="hello" size={20} />
          {busy ? 'Esperando a Windows Hello…' : 'Desbloquear con Windows Hello'}
        </button>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!real && <dl className={styles.meta}>
          <div><dt>Equipo</dt><dd className="mono">ABOG-PC-014</dd></div>
          <div><dt>Organización</dt><dd>Bufete Demo S.A.S.</dd></div>
          <div><dt>Estado</dt><dd><span className="chip chip-ok"><Icon name="shield" size={14} />TPM 2.0 verificado</span></dd></div>
        </dl>}
      </div>
      {asking && (
        <HelloDialog
          motivo="Desbloquear NEXUS CUBE en este equipo"
          onCancel={() => setAsking(false)}
          onConfirm={onUnlock}
        />
      )}
    </main>
  );
}
