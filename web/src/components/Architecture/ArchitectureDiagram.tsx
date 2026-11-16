import { MODULES } from '../../data/modules';
import { Icon } from '../Icons/Icon';
import styles from './Architecture.module.css';

const C = 220;
const R = 152;
const SATELLITES = MODULES.slice(1).map((m, k) => {
  const a = ((-90 + 60 * k) * Math.PI) / 180;
  return { ...m, x: C + R * Math.cos(a), y: C + R * Math.sin(a), k };
});
const CORE_HEX = Array.from({ length: 6 }, (_, k) => {
  const a = ((-90 + 60 * k) * Math.PI) / 180;
  return `${(C + 46 * Math.cos(a)).toFixed(1)},${(C + 46 * Math.sin(a)).toFixed(1)}`;
}).join(' ');
const MESH = `M${SATELLITES.map((s) => `${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join('L')}Z`;

type Props = { active: string | null; onActivate: (id: string | null) => void; visible: boolean };

export function ArchitectureDiagram({ active, onActivate, visible }: Props) {
  return (
    <svg
      className={styles.diagram}
      data-visible={visible}
      viewBox="0 0 440 440"
      role="img"
      aria-label="Diagrama: NEXUS CORE en el centro, conectado mediante canales autenticados con ID, VAULT, CIPHER, CIPHER AI, SENTINEL y TRUST."
    >
      <circle cx={C} cy={C} r={R} className={styles.orbit} />
      <path d={MESH} className={styles.mesh} pathLength={1} />

      {SATELLITES.map((s) => (
        <line
          key={`l-${s.id}`}
          x1={C} y1={C} x2={s.x} y2={s.y}
          pathLength={1}
          className={styles.link}
          data-active={active === s.id}
          style={{ transitionDelay: visible ? `${200 + s.k * 90}ms` : '0ms' }}
        />
      ))}

      <g
        className={styles.coreNode}
        data-active={active === 'core'}
        onMouseEnter={() => onActivate('core')}
        onMouseLeave={() => onActivate(null)}
      >
        <polygon points={CORE_HEX} />
        <Icon name="core" x={C - 13} y={C - 20} size={26} />
        <text x={C} y={C + 22} textAnchor="middle">CORE</text>
      </g>

      {SATELLITES.map((s) => (
        <g
          key={s.id}
          className={styles.node}
          data-active={active === s.id}
          onMouseEnter={() => onActivate(s.id)}
          onMouseLeave={() => onActivate(null)}
        >
          <circle cx={s.x} cy={s.y} r={30} />
          <Icon name={s.icon} x={s.x - 12} y={s.y - 12} size={24} />
          <text x={s.x} y={s.y + (s.y > C + 10 ? 50 : -42)} textAnchor="middle">{s.short}</text>
        </g>
      ))}
    </svg>
  );
}
