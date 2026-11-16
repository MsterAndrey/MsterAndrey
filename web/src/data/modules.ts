import type { IconName } from '../components/Icons/Icon';

export type ModuleInfo = {
  id: string;
  name: string;
  short: string;
  icon: IconName;
  description: string;
};

/** Los siete componentes de la arquitectura (ver docs/03-arquitectura-general.md). */
export const MODULES: ModuleInfo[] = [
  {
    id: 'core', name: 'NEXUS CORE', short: 'CORE', icon: 'core',
    description: 'Coordina políticas, identidad de servicios e incidentes, sin convertirse en un punto único de compromiso.',
  },
  {
    id: 'id', name: 'NEXUS ID', short: 'ID', icon: 'id',
    description: 'Identidad con passkeys y FIDO2. La biometría desbloquea tu llave en tu dispositivo y nunca viaja al servidor.',
  },
  {
    id: 'vault', name: 'NEXUS VAULT', short: 'VAULT', icon: 'vault',
    description: 'Almacenamiento cifrado por organización y compartimento, con versiones inmutables frente a ransomware.',
  },
  {
    id: 'cipher', name: 'CIPHER', short: 'CIPHER', icon: 'cipher',
    description: 'Lenguaje para políticas, detección y respuesta: tipado, determinista y sin autoridad implícita.',
  },
  {
    id: 'ai', name: 'CIPHER AI', short: 'AI', icon: 'ai',
    description: 'Interpreta, correlaciona y explica eventos. Propone acciones; quien las aprueba es una persona.',
  },
  {
    id: 'sentinel', name: 'NEXUS SENTINEL', short: 'SENTINEL', icon: 'sentinel',
    description: 'Detección y respuesta con salvaguardas: lo reversible se automatiza, lo disruptivo se aprueba.',
  },
  {
    id: 'trust', name: 'NEXUS TRUST', short: 'TRUST', icon: 'trust',
    description: 'Registro de auditoría verificable: cualquier alteración deja evidencia comprobable por terceros.',
  },
];
