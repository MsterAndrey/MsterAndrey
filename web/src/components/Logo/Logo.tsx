import { brand } from '../../app/brand';

type Theme = 'dark' | 'light' | 'mono-white' | 'mono-dark';
const suffix = (t: Theme) => (t === 'dark' ? '' : `-${t}`);

type Props = { theme?: Theme; height?: number; className?: string; decorative?: boolean };

/**
 * Los logotipos son archivos SVG independientes (public/brand), generados por
 * scripts/build-brand.mjs. Aquí sólo se referencian: una única fuente de verdad.
 */
export function NexusLogo({ theme = 'dark', height = 28, className, decorative }: Props) {
  return (
    <img
      src={brand(`nexus-cube-logo${suffix(theme)}.svg`)}
      alt={decorative ? '' : 'NEXUS CUBE'}
      height={height}
      width={Math.round(height * 4.876)}
      className={className}
      draggable={false}
    />
  );
}

export function NexusIsotipo({ theme = 'dark', height = 32, className, decorative }: Props) {
  return (
    <img
      src={brand(`nexus-cube-isotipo${suffix(theme)}.svg`)}
      alt={decorative ? '' : 'NEXUS CUBE'}
      height={height}
      width={height}
      className={className}
      draggable={false}
    />
  );
}

export function CipherLogo({ theme = 'dark', height = 28, className, decorative }: Props) {
  return (
    <img
      src={brand(`cipher-ai-logo${suffix(theme)}.svg`)}
      alt={decorative ? '' : 'CIPHER AI'}
      height={height}
      width={Math.round(height * 3.991)}
      className={className}
      draggable={false}
    />
  );
}

export function NexusWordmark({ height = 40, className }: { height?: number; className?: string }) {
  return (
    <img
      src={brand('nexus-cube-wordmark.svg')}
      alt="NEXUS CUBE"
      height={height}
      width={Math.round(height * 9.155)}
      className={className}
      draggable={false}
    />
  );
}
