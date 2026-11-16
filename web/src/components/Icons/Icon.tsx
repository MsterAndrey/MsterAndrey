import type { SVGProps } from 'react';

/**
 * Iconografía NEXUS CUBE: retícula de 24 px, trazo de 1.5 px, esquinas rectas,
 * sin rellenos. Coherente con la geometría del isotipo.
 */
const PATHS = {
  // Módulos
  core: 'M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4L12 2.8ZM12 9.2l2.4 1.4v2.8L12 14.8l-2.4-1.4v-2.8L12 9.2Z',
  id: 'M8 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0ZM4.5 20c.9-3.4 3.9-5.5 7.5-5.5s6.6 2.1 7.5 5.5M16.5 3.5l1.5-1.5M20 7h2',
  vault: 'M4 4h16v16H4V4ZM12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM12 8.5V7M15.5 12H17M12 15.5V17M8.5 12H7M7 20v1.5M17 20v1.5',
  cipher: 'M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 5l-3 14',
  ai: 'M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM12 3v6.5M12 14.5V21M4.2 7.5l5.6 3.2M14.2 13.3l5.6 3.2M19.8 7.5l-5.6 3.2M9.8 13.3l-5.6 3.2',
  sentinel: 'M12 21a9 9 0 1 1 9-9M12 16.5a4.5 4.5 0 1 1 4.5-4.5M12 12l7-7M17 17l2 2 3-3.5',
  trust: 'M12 3.5v4M12 7.5 6.5 12M12 7.5l5.5 4.5M6.5 12v4.5M17.5 12v4.5M10 2h4v3.5h-4V2ZM4.5 16.5h4V20h-4v-3.5ZM15.5 16.5h4V20h-4v-3.5Z',
  // Principios
  zeroTrust: 'M12 2.8 19.5 6v5.6c0 4.4-3.1 8.2-7.5 9.6-4.4-1.4-7.5-5.2-7.5-9.6V6L12 2.8ZM9 12h6M12 9v6',
  layers: 'M12 3 21 8l-9 5-9-5 9-5ZM3 12.5l9 5 9-5M3 16.5l9 5 9-5',
  crypto: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11ZM12 14.5v3',
  identity: 'M4 5h16v14H4V5ZM8.5 10.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM7 16c.5-1.6 1.9-2.5 3.5-2.5s3 .9 3.5 2.5M15.5 9.5H18M15.5 12.5H18',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3ZM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  audit: 'M6 3h9l3 3v15H6V3ZM9 9h6M9 12.5h6M9 16l1.8 1.8L15 13.5',
  // Utilidad
  mail: 'M3 5.5h18v13H3v-13ZM3.5 6l8.5 7 8.5-7',
  key: 'M14.5 4.5a5 5 0 1 1-3.6 8.4L4 19.8V21h3v-2h2v-2h2l1.2-1.2',
  building: 'M4 21V4h10v17M14 9h6v12M7.5 8h3M7.5 12h3M7.5 16h3M2 21h20',
  contract: 'M6 3h12v18H6V3ZM9 8h6M9 11.5h6M9 15h3.5M14 17.5l1.5 1.5 3-3',
  link: 'M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7L12.5 5.8M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7l1.1-1.1',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  plus: 'M12 5v14M5 12h14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  send: 'M4 12 20 4l-4 16-4.5-6.5L4 12ZM11.5 13.5 20 4',
  history: 'M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 7.5V12l3 2',
  back: 'M15 5l-7 7 7 7',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5.5M12 7.5V8',
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  stop: 'M7 7h10v10H7V7Z',
} as const;

export type IconName = keyof typeof PATHS;

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number; title?: string };

export function Icon({ name, size = 24, title, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}
