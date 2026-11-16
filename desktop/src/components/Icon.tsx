import type { SVGProps } from 'react';

/** Iconografía NEXUS CUBE (retícula 24 px, trazo 1,5 px). Base compartida con web/src/components/Icons. */
const PATHS = {
  home: 'M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  folder: 'M3.5 6.5h6l2 2h9v10.5h-17V6.5Z',
  folderLock: 'M3.5 6.5h6l2 2h9v10.5h-17V6.5ZM10 13.5v-1a2 2 0 1 1 4 0v1M9.5 13.5h5v3.5h-5v-3.5Z',
  restore: 'M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4h4M12 8v4l3 2',
  activity: 'M3 12h4l2.5-6 5 12 2.5-6h4',
  device: 'M3.5 5h17v11h-17V5ZM8.5 19.5h7M12 16v3.5',
  shield: 'M12 2.8 19.5 6v5.6c0 4.4-3.1 8.2-7.5 9.6-4.4-1.4-7.5-5.2-7.5-9.6V6L12 2.8ZM8.8 12l2.2 2.2 4.2-4.4',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11ZM12 14.5v3',
  hello: 'M7 4.5H5.5a1 1 0 0 0-1 1V7M17 4.5h1.5a1 1 0 0 1 1 1V7M7 19.5H5.5a1 1 0 0 1-1-1V17M17 19.5h1.5a1 1 0 0 0 1-1V17M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 15.5c1.5 1.3 3.5 1.3 5 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.6-3.3 3.2-5.5 6.5-5.5s5.9 2.2 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.8 3.2 2.6 3.5 5.2',
  file: 'M6 3h8l4 4v14H6V3ZM14 3v4h4',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  plus: 'M12 5v14M5 12h14',
  send: 'M4 12 20 4l-4 16-4.5-6.5L4 12ZM11.5 13.5 20 4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5.5M12 7.5V8',
  copy: 'M8 8h12v12H8V8ZM4 16V4h12',
  approve: 'M9 12l2 2 4-4M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  cloud: 'M7 18.5h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 18.5Z',
  alert: 'M12 4 21 19.5H3L12 4ZM12 10v4.5M12 17v.5',
  tree: 'M12 3.5v4M12 7.5 6.5 12M12 7.5l5.5 4.5M6.5 12v4.5M17.5 12v4.5M10 2h4v3.5h-4V2ZM4.5 16.5h4V20h-4v-3.5ZM15.5 16.5h4V20h-4v-3.5Z',
  close: 'M6 6l12 12M18 6 6 18',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...rest }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
