// Genera los logotipos de NEXUS CUBE y CIPHER AI como SVG vectoriales independientes.
// Las letras del wordmark son trazos geométricos propios (no dependen de fuentes instaladas).
// Uso: npm run brand  → escribe en public/brand/ y public/ (favicon, icono de app).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_BRAND = join(ROOT, 'public', 'brand');
const OUT_PUBLIC = join(ROOT, 'public');

const C = {
  blue: '#2563EB',
  navy: '#0F172A',
  white: '#FFFFFF',
  slate: '#64748B',
  violet: '#7C3AED',
  electric: '#38BDF8',
  violetTint: '#A78BFA', // tinte de #7C3AED para legibilidad sobre fondo oscuro
};

const pts = (a) => a.map((p) => p.join(',')).join(' ');
const r2 = (n) => Math.round(n * 100) / 100;

/* ───────────────────────── Isotipo NEXUS CUBE (viewBox 0 0 100 100) ───────────────────────── */

const HEX = [[50, 4], [90, 27], [90, 73], [50, 96], [10, 73], [10, 27]];
const FACE_TOP = [[50, 4], [90, 27], [50, 50], [10, 27]];
const FACE_LEFT = [[10, 27], [50, 50], [50, 96], [10, 73]];
const FACE_RIGHT = [[50, 50], [90, 27], [90, 73], [50, 96]];
const INNER_EDGES = 'M50 50L10 27M50 50L90 27M50 50V96';
// N centrada verticalmente en las dos caras frontales (simetría puntual).
const N_PATH = 'M27 76V44L73 76V44';

const CUBE_THEMES = {
  dark: {
    faces: ['rgba(56,189,248,0.22)', 'rgba(37,99,235,0.16)', 'rgba(124,58,237,0.18)'],
    edge: 'gradient', inner: 'rgba(148,197,255,0.55)', n: C.white,
    grad: [C.electric, C.blue, C.violet],
  },
  light: {
    faces: ['rgba(37,99,235,0.14)', 'rgba(37,99,235,0.07)', 'rgba(124,58,237,0.10)'],
    edge: 'gradient', inner: 'rgba(37,99,235,0.45)', n: C.navy,
    grad: [C.blue, C.blue, C.violet],
  },
  'mono-white': { faces: null, edge: C.white, inner: 'rgba(255,255,255,0.55)', n: C.white },
  'mono-dark': { faces: null, edge: C.navy, inner: 'rgba(15,23,42,0.55)', n: C.navy },
};

function cubeMark(id, theme) {
  const t = CUBE_THEMES[theme];
  const edgeStroke = t.edge === 'gradient' ? `url(#${id}-edge)` : t.edge;
  const defs = [
    t.edge === 'gradient'
      ? `<linearGradient id="${id}-edge" x1="10" y1="4" x2="90" y2="96" gradientUnits="userSpaceOnUse">` +
        `<stop offset="0" stop-color="${t.grad[0]}"/><stop offset="0.5" stop-color="${t.grad[1]}"/><stop offset="1" stop-color="${t.grad[2]}"/></linearGradient>`
      : '',
    // La máscara recorta las aristas alrededor de la N: funciona sobre cualquier fondo.
    `<mask id="${id}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">` +
      `<rect width="100" height="100" fill="#fff"/>` +
      `<path d="${N_PATH}" fill="none" stroke="#000" stroke-width="15" stroke-linejoin="miter"/></mask>`,
  ].join('');
  const faces = t.faces
    ? `<polygon points="${pts(FACE_TOP)}" fill="${t.faces[0]}"/>` +
      `<polygon points="${pts(FACE_LEFT)}" fill="${t.faces[1]}"/>` +
      `<polygon points="${pts(FACE_RIGHT)}" fill="${t.faces[2]}"/>`
    : '';
  return (
    `<defs>${defs}</defs>` +
    `<g mask="url(#${id}-cut)">${faces}` +
    `<path d="${INNER_EDGES}" fill="none" stroke="${t.inner}" stroke-width="2" stroke-linecap="round"/>` +
    `<polygon points="${pts(HEX)}" fill="none" stroke="${edgeStroke}" stroke-width="3.4" stroke-linejoin="round"/></g>` +
    `<path d="${N_PATH}" fill="none" stroke="${t.n}" stroke-width="7" stroke-linejoin="miter" stroke-miterlimit="10"/>`
  );
}

/* ───────────────────────── Isotipo CIPHER AI (viewBox 0 0 100 100) ───────────────────────── */

const NODE_R = 27;
const NODES = Array.from({ length: 6 }, (_, k) => {
  const a = ((-90 + 60 * k) * Math.PI) / 180;
  return [r2(50 + NODE_R * Math.cos(a)), r2(50 + NODE_R * Math.sin(a))];
});
const RING_R = 45;
const RING_SEG = (2 * Math.PI * RING_R) / 12;

const CIPHER_THEMES = {
  dark: { ring: 'gradient', line: 'rgba(148,197,255,0.45)', tri: 'rgba(167,139,250,0.35)', nodeA: C.electric, nodeB: C.violetTint, core: [C.white, C.electric, C.blue], halo: 'rgba(56,189,248,0.55)', inner: 'rgba(100,116,139,0.45)' },
  light: { ring: 'gradient', line: 'rgba(37,99,235,0.45)', tri: 'rgba(124,58,237,0.35)', nodeA: C.blue, nodeB: C.violet, core: [C.electric, C.blue, C.violet], halo: 'rgba(37,99,235,0.5)', inner: 'rgba(100,116,139,0.4)' },
  'mono-white': { ring: C.white, line: 'rgba(255,255,255,0.5)', tri: 'rgba(255,255,255,0.3)', nodeA: C.white, nodeB: C.white, core: null, coreFill: C.white, halo: 'rgba(255,255,255,0.6)', inner: 'rgba(255,255,255,0.3)' },
  'mono-dark': { ring: C.navy, line: 'rgba(15,23,42,0.5)', tri: 'rgba(15,23,42,0.3)', nodeA: C.navy, nodeB: C.navy, core: null, coreFill: C.navy, halo: 'rgba(15,23,42,0.6)', inner: 'rgba(15,23,42,0.3)' },
};

function cipherMark(id, theme) {
  const t = CIPHER_THEMES[theme];
  const ringStroke = t.ring === 'gradient' ? `url(#${id}-ring)` : t.ring;
  const hex = 'M' + NODES.map((p) => p.join(' ')).join('L') + 'Z';
  const spokes = NODES.map((p) => `M50 50L${p[0]} ${p[1]}`).join('');
  const tri = `M${NODES[0].join(' ')}L${NODES[2].join(' ')}L${NODES[4].join(' ')}Z`;
  const defs =
    (t.ring === 'gradient'
      ? `<linearGradient id="${id}-ring" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.electric}"/></linearGradient>`
      : '') +
    (t.core
      ? `<radialGradient id="${id}-core" cx="50" cy="50" r="11" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.core[0]}"/><stop offset="0.45" stop-color="${t.core[1]}"/><stop offset="1" stop-color="${t.core[2]}"/></radialGradient>`
      : '');
  const nodes = NODES.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.2" fill="${i % 2 ? t.nodeB : t.nodeA}"/>`).join('');
  return (
    `<defs>${defs}</defs>` +
    `<circle cx="50" cy="50" r="${RING_R}" fill="none" stroke="${ringStroke}" stroke-width="2.6" stroke-dasharray="${r2(RING_SEG - 4)} 4" transform="rotate(-88 50 50)"/>` +
    `<circle cx="50" cy="50" r="36" fill="none" stroke="${t.inner}" stroke-width="1"/>` +
    `<path d="${tri}" fill="none" stroke="${t.tri}" stroke-width="1.2"/>` +
    `<path d="${hex}" fill="none" stroke="${t.line}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="${spokes}" fill="none" stroke="${t.line}" stroke-width="1.6"/>` +
    nodes +
    `<circle cx="50" cy="50" r="15.5" fill="none" stroke="${t.halo}" stroke-width="1.2"/>` +
    `<circle cx="50" cy="50" r="11" fill="${t.core ? `url(#${id}-core)` : t.coreFill}"/>`
  );
}

/* ───────────────────────── Wordmark geométrico (altura 20) ───────────────────────── */

const GLYPHS = {
  N: { w: 14, d: 'M0 20V0L14 20V0' },
  E: { w: 12, d: 'M12 0H0V20H12M0 10H9.5' },
  X: { w: 14, d: 'M0 0L14 20M14 0L0 20' },
  U: { w: 14, d: 'M0 0V16L4 20H10L14 16V0' },
  S: { w: 14, d: 'M14 0H4L0 4V6L4 10H10L14 14V16L10 20H0' },
  C: { w: 13, d: 'M13 0H4L0 4V16L4 20H13' },
  B: { w: 14, d: 'M0 10H10L14 14V16L10 20H0V0H9L12 3V7L9 10' },
  I: { w: 0, d: 'M0 0V20' },
  P: { w: 14, d: 'M0 20V0H10L14 4V6L10 10H0' },
  H: { w: 14, d: 'M0 0V20M14 0V20M0 10H14' },
  R: { w: 14, d: 'M0 20V0H10L14 4V6L10 10H0M8.5 10L14 20' },
  A: { w: 14, d: 'M0 20V6L6 0H8L14 6V20M0 13H14' },
};
const TRACK = 6.2;
const SPACE = 16;
const STROKE = 2.7;

/** parts: [{ text, color }] → { body, width } en unidades de altura 20 */
function wordmark(parts) {
  let x = STROKE / 2;
  const out = [];
  parts.forEach((part, pi) => {
    if (pi > 0) x += SPACE;
    const ds = [];
    [...part.text].forEach((ch, i) => {
      const g = GLYPHS[ch];
      if (!g) throw new Error(`Glifo no definido: ${ch}`);
      if (i > 0) x += TRACK;
      ds.push(`<path transform="translate(${r2(x)} 0)" d="${g.d}"/>`);
      x += g.w;
    });
    out.push(`<g stroke="${part.color}">${ds.join('')}</g>`);
  });
  const width = x + STROKE / 2;
  return {
    body: `<g fill="none" stroke-width="${STROKE}" stroke-linejoin="miter" stroke-linecap="butt" stroke-miterlimit="4">${out.join('')}</g>`,
    width,
  };
}

/* ───────────────────────── Composición de archivos ───────────────────────── */

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${r2(w)}" height="${r2(h)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

function lockup(markFn, id, theme, parts, title) {
  const H = 60;
  const GAP = 18;
  const S = 1.15; // escala del wordmark
  const wm = wordmark(parts);
  const wmH = 20 * S;
  const width = H + GAP + wm.width * S + 4;
  const body =
    `<g transform="scale(${H / 100})">${markFn(id, theme)}</g>` +
    `<g transform="translate(${H + GAP} ${r2((H - wmH) / 2)}) scale(${S})">${wm.body}</g>`;
  return svg(width, H, body, title);
}

const files = {};

const NEXUS_PARTS = {
  dark: [{ text: 'NEXUS', color: C.white }, { text: 'CUBE', color: C.blue }],
  light: [{ text: 'NEXUS', color: C.navy }, { text: 'CUBE', color: C.blue }],
  'mono-white': [{ text: 'NEXUS', color: C.white }, { text: 'CUBE', color: C.white }],
  'mono-dark': [{ text: 'NEXUS', color: C.navy }, { text: 'CUBE', color: C.navy }],
};
const CIPHER_PARTS = {
  dark: [{ text: 'CIPHER', color: C.white }, { text: 'AI', color: C.violetTint }],
  light: [{ text: 'CIPHER', color: C.navy }, { text: 'AI', color: C.violet }],
  'mono-white': [{ text: 'CIPHER', color: C.white }, { text: 'AI', color: C.white }],
  'mono-dark': [{ text: 'CIPHER', color: C.navy }, { text: 'AI', color: C.navy }],
};

for (const theme of Object.keys(CUBE_THEMES)) {
  const suffix = theme === 'dark' ? '' : `-${theme}`;
  files[`brand/nexus-cube-logo${suffix}.svg`] = lockup(cubeMark, `nc${theme}`, theme, NEXUS_PARTS[theme], 'NEXUS CUBE');
  files[`brand/nexus-cube-isotipo${suffix}.svg`] = svg(100, 100, cubeMark(`nci${theme}`, theme), 'NEXUS CUBE');
  files[`brand/cipher-ai-logo${suffix}.svg`] = lockup(cipherMark, `ca${theme}`, theme, CIPHER_PARTS[theme], 'CIPHER AI');
  files[`brand/cipher-ai-isotipo${suffix}.svg`] = svg(100, 100, cipherMark(`cai${theme}`, theme), 'CIPHER AI');
}

// Wordmarks solos (titulares).
for (const theme of ['dark', 'light']) {
  const suffix = theme === 'dark' ? '' : `-${theme}`;
  const wm = wordmark(NEXUS_PARTS[theme]);
  files[`brand/nexus-cube-wordmark${suffix}.svg`] = svg(wm.width, 20, wm.body, 'NEXUS CUBE');
}

// Marca N aislada (grabado en las caras del cubo 3D).
files['brand/nexus-n-mark.svg'] = svg(
  100, 100,
  `<path d="${N_PATH}" fill="none" stroke="${C.electric}" stroke-width="6" stroke-linejoin="miter"/>`,
  'N',
);

// Favicon: silueta rellena para máxima legibilidad a 16–32 px, sobre fondos claros y oscuros.
const favicon =
  `<polygon points="${pts(HEX)}" fill="${C.navy}" stroke="${C.blue}" stroke-width="7" stroke-linejoin="round"/>` +
  `<path d="M28 75V41L72 75V41" fill="none" stroke="${C.white}" stroke-width="10.5" stroke-linejoin="miter"/>`;
files['favicon.svg'] = svg(100, 100, favicon, 'NEXUS CUBE');
files['brand/nexus-cube-favicon.svg'] = files['favicon.svg'];

// Icono de aplicación (512): fondo navy, resplandor sutil, isotipo.
const appIcon = (markFn, id, title) =>
  svg(
    512, 512,
    `<defs><radialGradient id="${id}-bg" cx="256" cy="230" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1E2B55"/><stop offset="1" stop-color="${C.navy}"/></radialGradient></defs>` +
      `<rect width="512" height="512" rx="112" fill="url(#${id}-bg)"/>` +
      `<rect x="0.5" y="0.5" width="511" height="511" rx="111.5" fill="none" stroke="rgba(148,163,184,0.18)"/>` +
      `<g transform="translate(96 96) scale(3.2)">${markFn(id, 'dark')}</g>`,
    title,
  );
files['app-icon.svg'] = appIcon(cubeMark, 'app', 'NEXUS CUBE');
files['brand/nexus-cube-app-icon.svg'] = files['app-icon.svg'];
files['brand/cipher-ai-app-icon.svg'] = appIcon(cipherMark, 'capp', 'CIPHER AI');

// Avatar de chat de CIPHER AI: núcleo dentro de un círculo.
files['brand/cipher-ai-avatar.svg'] = svg(
  100, 100,
  `<circle cx="50" cy="50" r="50" fill="${C.navy}"/><g transform="translate(12 12) scale(0.76)">${cipherMark('cav', 'dark')}</g>`,
  'CIPHER AI',
);

mkdirSync(OUT_BRAND, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT_PUBLIC, name), content);
}
console.log(`Generados ${Object.keys(files).length} archivos SVG.`);
