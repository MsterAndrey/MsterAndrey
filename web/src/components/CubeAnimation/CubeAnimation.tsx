import { memo } from 'react';
import { brand } from '../../app/brand';
import { useInView } from '../../hooks/useInView';
import { CircuitPattern } from './CircuitPattern';
import { Particles } from './Particles';
import styles from './CubeAnimation.module.css';

const FACES = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;

/**
 * Cubo tridimensional de NEXUS CUBE con CSS 3D (sin WebGL ni dependencias).
 * - Capa exterior de vidrio con trazas de circuito y la N grabada.
 * - Núcleo interior que gira en sentido contrario: protección multicapa.
 * - Las animaciones se pausan fuera de pantalla y respetan prefers-reduced-motion.
 */
export const CubeAnimation = memo(function CubeAnimation({ className = '' }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '0px', threshold: 0 });

  return (
    <div ref={ref} className={`${styles.stage} ${className}`} data-paused={!inView} aria-hidden="true">
      <div className={styles.halo} />
      <div className={styles.platform}>
        <span />
        <span />
      </div>

      <div className={styles.scene}>
        <div className={styles.tilt}>
          <div className={styles.spin}>
            {FACES.map((f) => (
              <div key={f} className={`${styles.face} ${styles[f]}`}>
                <CircuitPattern className={styles.circuit} />
                <img className={styles.mark} src={brand('nexus-n-mark.svg')} alt="" draggable={false} />
              </div>
            ))}
            <div className={styles.inner}>
              <div className={styles.innerSpin}>
                {FACES.map((f) => (
                  <div key={f} className={`${styles.innerFace} ${styles[`i_${f}`]}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.core}>
        <span />
      </div>
      <Particles />
    </div>
  );
});
