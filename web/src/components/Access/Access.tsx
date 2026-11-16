import { ACCESS_EMAIL } from '../../app/brand';
import { ButtonLink } from '../Button/Button';
import { Icon, type IconName } from '../Icons/Icon';
import { Reveal } from '../Reveal/Reveal';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import styles from './Access.module.css';

const STEPS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'mail', title: 'Solicitud', text: 'Escríbenos desde el correo corporativo de tu empresa.' },
  { icon: 'building', title: 'Verificación', text: 'Validamos la empresa y a su representante legal.' },
  { icon: 'contract', title: 'Contrato', text: 'Acuerdo de servicio y de tratamiento de datos.' },
  { icon: 'key', title: 'Llave de seguridad', text: 'El administrador registra una llave FIDO2.' },
  { icon: 'link', title: 'Enlace seguro', text: 'Descarga de un solo uso, protegida con esa llave.' },
];

export function Access() {
  return (
    <section id="acceso" className={styles.section} aria-labelledby="acceso-title">
      <div className="container">
        <SectionHeader
          id="acceso-title"
          eyebrow="Acceso"
          title="Acceso controlado, por diseño."
          lead="NEXUS CUBE no se descarga desde esta página, y esta página no está conectada al sistema. El acceso se concede a empresas mediante un proceso verificado."
        />

        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 80} className={styles.step}>
              <span className={styles.icon}>
                <Icon name={s.icon} size={20} />
              </span>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.text}>{s.text}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className={styles.cta}>
          <ButtonLink href={`mailto:${ACCESS_EMAIL}?subject=${encodeURIComponent('Solicitud de acceso a NEXUS CUBE')}`}>
            <Icon name="mail" size={18} />
            Solicitar acceso por correo
          </ButtonLink>
          <p className={styles.warning}>
            <Icon name="info" size={16} />
            NEXUS CUBE nunca envía instaladores adjuntos ni enlaces de descarga sin verificación previa. Si recibes uno,
            no lo abras.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
