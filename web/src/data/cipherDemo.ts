/**
 * Datos de DEMOSTRACIÓN de CIPHER AI.
 * Todo es ficticio: organización "Demo S.A.S.", usuarios, hosts y cifras inventados.
 * No hay ninguna conexión con sistemas reales ni con un modelo de IA: las respuestas son guiones fijos.
 */

export type Block =
  | { type: 'text'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'evidence'; title: string; rows: Array<[string, string]> }
  | { type: 'code'; language: string; code: string }
  | { type: 'action'; title: string; effect: 'Reversible' | 'Disruptiva'; detail: string };

export type Message = { id: string; role: 'user' | 'assistant'; blocks: Block[] };

export type Conversation = { id: string; title: string; when: string; messages: Message[] };

export const PROCESSING_STEPS = [
  'Analizando…',
  'Procesando…',
  'Verificando información…',
  'Consultando fuentes autorizadas…',
  'Preparando respuesta…',
] as const;

export const SUGGESTIONS = [
  '¿Hubo accesos inusuales hoy?',
  'Explica la alerta de cifrado masivo',
  'Resume la semana',
  '¿Qué hace la política de exportación?',
];

const R_ACCESS: Block[] = [
  { type: 'text', text: 'Encontré un patrón inusual en las últimas 24 horas en la organización de demostración:' },
  {
    type: 'evidence',
    title: 'Evidencia (ficticia)',
    rows: [
      ['Usuario', 'usuario.demo-07'],
      ['Evento', '4 intentos de acceso fallidos desde un dispositivo no registrado'],
      ['Origen', 'Red no habitual · 02:14–02:31'],
      ['Resultado', 'Bloqueado por la política: el dispositivo no tiene una passkey registrada'],
    ],
  },
  {
    type: 'text',
    text: 'Como la autenticación usa passkeys, una contraseña filtrada no basta para entrar. Aun así, conviene confirmarlo con la persona.',
  },
  {
    type: 'action',
    title: 'Revocar las sesiones activas de usuario.demo-07 y pedir una nueva autenticación',
    effect: 'Reversible',
    detail: 'Requiere tu aprobación con llave de seguridad. No disponible en esta demostración.',
  },
];

const R_RANSOMWARE: Block[] = [
  {
    type: 'text',
    text: 'La alerta "cifrado masivo" del compartimento Proyectos-Demo combina tres señales en 5 minutos:',
  },
  {
    type: 'list',
    items: [
      '212 archivos reescritos desde una misma sesión (lo habitual es menos de 15).',
      'Entropía media del contenido nuevo de 7,9 bits/byte, compatible con datos cifrados.',
      'El 64 % de los archivos cambió de extensión.',
    ],
  },
  {
    type: 'text',
    text: 'SENTINEL ya ejecutó la contención reversible: el compartimento quedó en solo lectura. Las versiones anteriores son inmutables y se pueden restaurar.',
  },
  {
    type: 'action',
    title: 'Aislar de la red el equipo DEMO-PC-114',
    effect: 'Disruptiva',
    detail: 'Una acción disruptiva siempre requiere la aprobación de una persona. No disponible en esta demostración.',
  },
];

const R_SUMMARY: Block[] = [
  { type: 'text', text: 'Resumen de la semana para Demo S.A.S. (datos ficticios):' },
  {
    type: 'evidence',
    title: 'Actividad',
    rows: [
      ['Alertas nuevas', '23 (2 altas, 7 medias, 14 bajas)'],
      ['Incidentes abiertos', '1 · cifrado masivo en Proyectos-Demo'],
      ['Aprobaciones pendientes', '2 · exportación de un compartimento'],
      ['Integridad del registro', 'Checkpoint verificado por 3 de 3 testigos'],
    ],
  },
  {
    type: 'text',
    text: 'Recomendación: revisar las dos aprobaciones pendientes antes del viernes; vencen en 24 horas.',
  },
];

const R_POLICY: Block[] = [
  {
    type: 'text',
    text: 'La política de exportación exige dos aprobaciones de custodios distintos de la persona que solicita:',
  },
  {
    type: 'code',
    language: 'cipher',
    code: `require_approval export_compartment
  when action == vault::Export
  quorum 2 of group("custodians") excluding principal
  expires 24h`,
  },
  {
    type: 'text',
    text: 'Ni siquiera un administrador puede exportar datos por sí solo. Cada aprobación es una firma con llave de seguridad y queda registrada en NEXUS TRUST.',
  },
];

const R_DEFAULT: Block[] = [
  {
    type: 'text',
    text: 'Esta es una demostración con respuestas predefinidas: no estoy conectado a ningún sistema ni a datos reales. Prueba con una de las preguntas sugeridas.',
  },
];

/** Selección de la respuesta guionada por palabras clave. */
export function scriptedReply(input: string): Block[] {
  const q = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (/(ransom|cifrado masivo|alerta)/.test(q)) return R_RANSOMWARE;
  if (/(acceso|inusual|login|sesion|intento)/.test(q)) return R_ACCESS;
  if (/(resum|semana|informe|reporte)/.test(q)) return R_SUMMARY;
  if (/(politic|export|aprobaci)/.test(q)) return R_POLICY;
  return R_DEFAULT;
}

let seq = 0;
export const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    title: 'Accesos inusuales',
    when: 'Hoy',
    messages: [
      { id: 'c1-u', role: 'user', blocks: [{ type: 'text', text: '¿Hubo accesos inusuales hoy?' }] },
      { id: 'c1-a', role: 'assistant', blocks: R_ACCESS },
    ],
  },
  {
    id: 'c2',
    title: 'Alerta de cifrado masivo',
    when: 'Ayer',
    messages: [
      { id: 'c2-u', role: 'user', blocks: [{ type: 'text', text: 'Explica la alerta de cifrado masivo' }] },
      { id: 'c2-a', role: 'assistant', blocks: R_RANSOMWARE },
    ],
  },
  {
    id: 'c3',
    title: 'Política de exportación',
    when: 'Esta semana',
    messages: [
      { id: 'c3-u', role: 'user', blocks: [{ type: 'text', text: '¿Qué hace la política de exportación?' }] },
      { id: 'c3-a', role: 'assistant', blocks: R_POLICY },
    ],
  },
];
