import { useState } from 'react';
import { MODULES } from '../../data/modules';
import { useInView } from '../../hooks/useInView';
import { Icon } from '../Icons/Icon';
import { Reveal } from '../Reveal/Reveal';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import styles from './Architecture.module.css';

export function Architecture() {
  const [active, setActive] = useState<string | null>(null);
  const [ref, visible] = useInView<HTMLDivElement>({ once: true, threshold: 0.25 });

  return (
    <section id="plataforma" className={styles.section} aria-labelledby="plataforma-title">
      <div className="container">
        <SectionHeader
          id="plataforma-title"
          eyebrow="Plataforma"
          title="Siete componentes independientes. Ningún punto único de compromiso."
          lead="Cada módulo tiene su propia identidad, sus propios permisos y su propio límite de aislamiento. Comprometer uno no entrega los demás."
        />

        <div className={styles.body}>
          <div ref={ref} className={styles.diagramWrap}>
            <ArchitectureDiagram active={active} onActivate={setActive} visible={visible} />
          </div>

          <ul className={styles.list}>
            {MODULES.map((m, i) => (
              <Reveal as="li" key={m.id} delay={i * 60}>
                <div
                  className={styles.item}
                  data-active={active === m.id}
                  tabIndex={0}
                  onMouseEnter={() => setActive(m.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(m.id)}
                  onBlur={() => setActive(null)}
                >
                  <span className={styles.itemIcon}>
                    <Icon name={m.icon} size={20} />
                  </span>
                  <div>
                    <h3 className={styles.itemName}>{m.name}</h3>
                    <p className={styles.itemText}>{m.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal>
          <p className={styles.note}>
            <Icon name="info" size={16} />
            Estado: arquitectura definida y en revisión. Los componentes están en diseño; ninguno está disponible
            comercialmente todavía.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
