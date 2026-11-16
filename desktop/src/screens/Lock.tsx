import { useState } from 'react';
import { HelloDialog } from '../components/HelloDialog';
import { Icon } from '../components/Icon';
import styles from './Lock.module.css';

export function Lock({ onUnlock }: { onUnlock: () => Promise<void> }) {
  const [asking, setAsking] = useState(false);
  return (
    <main className={styles.lock}>
      <p className={styles.proto}>Prototipo de interfaz · datos ficticios · Windows Hello simulado</p>
      <div className={styles.card}>
        <img src="./brand/nexus-cube-logo.svg" alt="NEXUS CUBE" height={40} width={195} />
        <div className={styles.text}>
          <h1>NEXUS CUBE está bloqueado</h1>
          <p>Tus carpetas protegidas siguen cifradas. Desbloquéalas con Windows Hello: tu huella o tu rostro se verifican en este equipo y nunca se envían.</p>
        </div>
        <button type="button" className={`btn btn-primary ${styles.cta}`} onClick={() => setAsking(true)}>
          <Icon name="hello" size={20} />
          Desbloquear con Windows Hello
        </button>
        <dl className={styles.meta}>
          <div><dt>Equipo</dt><dd className="mono">ABOG-PC-014</dd></div>
          <div><dt>Organización</dt><dd>Bufete Demo S.A.S.</dd></div>
          <div><dt>Estado</dt><dd><span className="chip chip-ok"><Icon name="shield" size={14} />TPM 2.0 verificado</span></dd></div>
        </dl>
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
