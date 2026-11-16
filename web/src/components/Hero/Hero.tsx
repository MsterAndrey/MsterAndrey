import { ButtonLink } from '../Button/Button';
import { CubeAnimation } from '../CubeAnimation/CubeAnimation';
import { NexusWordmark } from '../Logo/Logo';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="inicio" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.grid} aria-hidden="true" />
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <p className={styles.descriptor}>Advanced Cybersecurity Infrastructure</p>
          <h1 id="hero-title" className={styles.title}>
            <NexusWordmark height={44} className={styles.wordmark} />
          </h1>
          <p className={styles.tagline}>Una nueva arquitectura para proteger la información.</p>
          <p className={styles.description}>
            Infraestructura de seguridad inteligente diseñada para proteger identidades, información y sistemas
            empresariales mediante criptografía avanzada, aislamiento y verificación continua.
          </p>
          <div className={styles.actions}>
            <ButtonLink href="#plataforma" arrow>Explorar tecnología</ButtonLink>
            <ButtonLink href="#cipher-ai" variant="secondary">Conocer CIPHER AI</ButtonLink>
          </div>
          <p className={styles.status}>
            <span className={styles.dot} aria-hidden="true" />
            Proyecto en fase de diseño y desarrollo. Aún no disponible comercialmente.
          </p>
        </div>

        <div className={styles.visual}>
          <CubeAnimation />
        </div>
      </div>
    </section>
  );
}
