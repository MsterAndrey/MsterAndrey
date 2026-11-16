import type { IconName } from '../components/Icons/Icon';

export const PRINCIPLES: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'zeroTrust', title: 'Zero Trust',
    text: 'Ninguna petición es confiable por su origen. Cada acceso se autentica y se autoriza con su contexto.',
  },
  {
    icon: 'layers', title: 'Defensa multicapa',
    text: 'Identidad, dispositivo, política, cifrado y auditoría: cada capa limita el impacto de un fallo en otra.',
  },
  {
    icon: 'crypto', title: 'Criptografía avanzada',
    text: 'Estándares auditados (AES-256-GCM, ML-KEM, ML-DSA) en esquemas híbridos. Ningún algoritmo propio.',
  },
  {
    icon: 'identity', title: 'Identidad verificable',
    text: 'Passkeys FIDO2 resistentes al phishing. La biometría se verifica en tu dispositivo y nunca se envía.',
  },
  {
    icon: 'data', title: 'Protección de datos',
    text: 'Claves por organización y compartimento. Sin clave maestra universal ni administrador con acceso total.',
  },
  {
    icon: 'audit', title: 'Auditoría e integridad',
    text: 'Registro en árbol de Merkle con testigos externos: una alteración deja evidencia verificable.',
  },
];

export const VERIFICATION_FLOW = [
  { title: 'Solicitud', detail: 'Usuario, servicio o IA' },
  { title: 'Identidad', detail: 'Passkey FIDO2' },
  { title: 'Dispositivo', detail: 'Postura atestada' },
  { title: 'Política', detail: 'Evaluada en CIPHER' },
  { title: 'Auditoría', detail: 'Registro en TRUST' },
  { title: 'Acceso', detail: 'Mínimo necesario' },
];
