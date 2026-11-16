import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInView } from '../../hooks/useInView';

type Props = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
};

/** Hace aparecer su contenido suavemente la primera vez que entra en pantalla. */
export function Reveal({ children, as: Tag = 'div', delay = 0, className = '' }: Props) {
  const [ref, inView] = useInView<HTMLElement>({ once: true });
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
