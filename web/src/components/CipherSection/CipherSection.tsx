import { INITIAL_CONVERSATIONS } from '../../data/cipherDemo';
import { ButtonLink } from '../Button/Button';
import { ChatMessage } from '../CipherChat/ChatMessage';
import { CipherCore } from '../CipherCore/CipherCore';
import { CipherLogo } from '../Logo/Logo';
import { Icon } from '../Icons/Icon';
import { Reveal } from '../Reveal/Reveal';
import { useInView } from '../../hooks/useInView';
import styles from './CipherSection.module.css';

const CAPABILITIES = [
  'Interpreta eventos y anomalías en lenguaje claro.',
  'Correlaciona alertas y reconstruye la línea temporal de un incidente.',
  'Consulta únicamente los datos que tú estás autorizado a ver.',
  'Redacta informes y recomienda acciones con su evidencia.',
];

const LIMITS = [
  'Sin acceso a claves ni a datos cifrados de extremo a extremo.',
  'Actúa con tus permisos, nunca con más.',
  'No puede autorizarse a sí misma: cada acción la aprueba una persona.',
];

const PREVIEW = INITIAL_CONVERSATIONS[0]!.messages;

export function CipherSection() {
  const [coreRef, coreVisible] = useInView<HTMLDivElement>({ threshold: 0 });
  return (
    <section id="cipher-ai" className={styles.section} aria-labelledby="cipher-title">
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <Reveal className={styles.head}>
            <div ref={coreRef} className={styles.coreWrap}>
              <CipherCore size={96} animated={coreVisible} />
            </div>
            <CipherLogo height={34} />
            <p className={styles.descriptor}>Intelligent Security Engine</p>
          </Reveal>

          <Reveal delay={80}>
            <h2 id="cipher-title" className={styles.title}>El núcleo inteligente de NEXUS CUBE.</h2>
            <p className={styles.lead}>
              CIPHER AI trabaja dentro de la arquitectura de NEXUS CUBE: lee lo que SENTINEL detecta, consulta lo que
              NEXUS TRUST registra y respeta las políticas de CIPHER. Ayuda a los equipos de seguridad a entender y
              decidir más rápido.
            </p>
          </Reveal>

          <Reveal delay={140}>
            <ul className={styles.caps}>
              {CAPABILITIES.map((c) => (
                <li key={c}>
                  <Icon name="check" size={16} />
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={200} className={styles.limits}>
            <p className={styles.limitsTitle}>Límites por diseño</p>
            <ul>
              {LIMITS.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={240}>
            <ButtonLink href="#demo-cipher-ai" arrow>Abrir demostración</ButtonLink>
          </Reveal>
        </div>

        <Reveal delay={120} className={styles.preview}>
          <div className={styles.window}>
            <div className={styles.windowBar}>
              <CipherCore size={18} animated={false} />
              <span>CIPHER AI</span>
              <span className={styles.windowTag}>Ejemplo ilustrativo · datos ficticios</span>
            </div>
            <div className={styles.windowBody} inert>
              {PREVIEW.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
