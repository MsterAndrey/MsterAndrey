import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Common = { variant?: Variant; size?: 'md' | 'sm'; arrow?: boolean; children: ReactNode };

const cls = (variant: Variant, size: 'md' | 'sm', extra?: string) =>
  [styles.btn, styles[variant], size === 'sm' ? styles.sm : '', extra ?? ''].join(' ').trim();

const Arrow = () => (
  <svg className={styles.arrow} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function ButtonLink({
  variant = 'primary', size = 'md', arrow, children, className, ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cls(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </a>
  );
}

export function Button({
  variant = 'primary', size = 'md', arrow, children, className, type = 'button', ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cls(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
