import type { CSSProperties } from 'react';
import { VERIFICATION_FLOW } from '../../data/principles';
import { useInView } from '../../hooks/useInView';
import styles from './Security.module.css';

/** Secuencia animada: cada paso se ilumina en orden, mostrando el recorrido de una solicitud. */
export function VerificationFlow() {
  const [ref, inView] = useInView<HTMLOListElement>({ threshold: 0.3 });
  return (
    <ol
      ref={ref}
      className={styles.flow}
      data-running={inView}
      style={{ '--steps': VERIFICATION_FLOW.length } as CSSProperties}
    >
      {VERIFICATION_FLOW.map((s, i) => (
        <li key={s.title} className={styles.step} style={{ '--i': i } as CSSProperties}>
          <span className={styles.stepIndex}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.stepTitle}>{s.title}</span>
          <span className={styles.stepDetail}>{s.detail}</span>
        </li>
      ))}
    </ol>
  );
}
