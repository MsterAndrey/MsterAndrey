import type { ReactNode } from 'react';
import { Reveal } from '../Reveal/Reveal';
import styles from './SectionHeader.module.css';

type Props = { eyebrow: string; title: ReactNode; lead?: ReactNode; align?: 'left' | 'center'; id?: string };

export function SectionHeader({ eyebrow, title, lead, align = 'left', id }: Props) {
  return (
    <Reveal className={`${styles.header} ${align === 'center' ? styles.center : ''}`}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2 className={styles.title} id={id}>{title}</h2>
      {lead && <p className={styles.lead}>{lead}</p>}
    </Reveal>
  );
}
