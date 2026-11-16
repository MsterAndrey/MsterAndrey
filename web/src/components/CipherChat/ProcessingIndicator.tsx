import { CipherCore } from '../CipherCore/CipherCore';
import styles from './CipherChat.module.css';

export function ProcessingIndicator({ step }: { step: string }) {
  return (
    <div className={styles.processing} role="status" aria-live="polite">
      <CipherCore size={36} state="processing" />
      <span className={styles.processingText} key={step}>{step}</span>
    </div>
  );
}
