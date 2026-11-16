import { PRINCIPLES } from '../../data/principles';
import { Icon } from '../Icons/Icon';
import { Reveal } from '../Reveal/Reveal';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { KeyHierarchy } from './KeyHierarchy';
import { VerificationFlow } from './VerificationFlow';
import styles from './Security.module.css';

export function Security() {
  return (
    <section id="seguridad" className={styles.section} aria-labelledby="seguridad-title">
      <div className="container">
        <SectionHeader
          id="seguridad-title"
          eyebrow="Seguridad"
          title="Seguridad diseñada, no prometida."
          lead="Principios de arquitectura que guían cada decisión. Antes de cualquier afirmación comercial se validarán con pruebas y auditorías independientes."
        />

        <ul className={styles.principles}>
          {PRINCIPLES.map((p, i) => (
            <Reveal as="li" key={p.title} delay={(i % 3) * 80} className={styles.principle}>
              <Icon name={p.icon} size={22} className={styles.principleIcon} />
              <h3 className={styles.principleTitle}>{p.title}</h3>
              <p className={styles.principleText}>{p.text}</p>
            </Reveal>
          ))}
        </ul>

        <div id="tecnologia" className={styles.tech}>
          <Reveal className={styles.figure}>
            <h3 className={styles.figTitle}>Cada solicitud, verificada</h3>
            <p className={styles.figText}>
              Ninguna petición llega a los datos sin atravesar identidad, postura del dispositivo y política, y
              sin quedar registrada.
            </p>
            <VerificationFlow />
          </Reveal>

          <Reveal className={styles.figure} delay={120}>
            <h3 className={styles.figTitle}>Sin clave maestra</h3>
            <p className={styles.figText}>
              Cada organización tiene su propia raíz criptográfica. No existe una clave capaz de abrirlas todas.
            </p>
            <KeyHierarchy />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
