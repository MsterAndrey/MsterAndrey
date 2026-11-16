import { useEffect, useState } from 'react';
import { brand } from '../app/brand';
import { CipherCore } from '../components/CipherCore/CipherCore';
import { Icon } from '../components/Icons/Icon';
import { NexusLogo } from '../components/Logo/Logo';
import styles from './BrandPage.module.css';

type Asset = { file: string; label: string; bg: 'dark' | 'light'; wide?: boolean };

const NEXUS_ASSETS: Asset[] = [
  { file: 'nexus-cube-logo.svg', label: 'Logo principal · fondo oscuro', bg: 'dark', wide: true },
  { file: 'nexus-cube-logo-light.svg', label: 'Logo principal · fondo claro', bg: 'light', wide: true },
  { file: 'nexus-cube-logo-mono-white.svg', label: 'Monocromático blanco', bg: 'dark', wide: true },
  { file: 'nexus-cube-logo-mono-dark.svg', label: 'Monocromático oscuro', bg: 'light', wide: true },
  { file: 'nexus-cube-isotipo.svg', label: 'Isotipo', bg: 'dark' },
  { file: 'nexus-cube-isotipo-light.svg', label: 'Isotipo · claro', bg: 'light' },
  { file: 'nexus-cube-favicon.svg', label: 'Favicon', bg: 'dark' },
  { file: 'nexus-cube-app-icon.svg', label: 'Icono de aplicación', bg: 'light' },
];

const CIPHER_ASSETS: Asset[] = [
  { file: 'cipher-ai-logo.svg', label: 'Logo · fondo oscuro', bg: 'dark', wide: true },
  { file: 'cipher-ai-logo-light.svg', label: 'Logo · fondo claro', bg: 'light', wide: true },
  { file: 'cipher-ai-isotipo.svg', label: 'Isotipo', bg: 'dark' },
  { file: 'cipher-ai-isotipo-mono-white.svg', label: 'Monocromático', bg: 'dark' },
  { file: 'cipher-ai-avatar.svg', label: 'Avatar de chat', bg: 'light' },
  { file: 'cipher-ai-app-icon.svg', label: 'Icono de aplicación', bg: 'dark' },
];

const PALETTE = [
  { name: 'Primary Blue', hex: '#2563EB', use: 'Acción principal, enlaces, foco de marca' },
  { name: 'Deep Navy', hex: '#0F172A', use: 'Superficies, fondo de la marca' },
  { name: 'White', hex: '#FFFFFF', use: 'Texto sobre oscuro, fondos claros' },
  { name: 'Slate', hex: '#64748B', use: 'Metadatos y elementos secundarios' },
  { name: 'Purple', hex: '#7C3AED', use: 'Identidad de CIPHER AI, contenido generado por IA' },
  { name: 'Electric Blue', hex: '#38BDF8', use: 'Acentos, estados activos, datos en movimiento' },
];

const DERIVED = [
  { name: 'Fondo base', hex: '#080D1A' },
  { name: 'Texto secundario', hex: '#A3B1C6' },
  { name: 'Violeta legible', hex: '#A78BFA' },
  { name: 'Precaución', hex: '#F59E0B' },
];

const RULES = [
  ['Sí', 'Usar el isotipo solo a partir de 16 px; por debajo, el favicon.'],
  ['Sí', 'Respetar un margen libre alrededor del logotipo igual a la altura de la N.'],
  ['Sí', 'Marcar en violeta todo contenido generado por CIPHER AI.'],
  ['No', 'Deformar, rotar o recolorear el cubo fuera de las variantes oficiales.'],
  ['No', 'Añadir brillos, sombras o neones al logotipo.'],
  ['No', 'Mostrar indicadores de seguridad que el sistema no pueda respaldar.'],
];

function AssetGrid({ assets }: { assets: Asset[] }) {
  return (
    <ul className={styles.assets}>
      {assets.map((a) => (
        <li key={a.file} className={`${styles.asset} ${a.wide ? styles.wide : ''}`}>
          <div className={styles.preview} data-bg={a.bg}>
            <img src={brand(a.file)} alt={a.label} loading="lazy" />
          </div>
          <div className={styles.assetMeta}>
            <span>{a.label}</span>
            <a href={brand(a.file)} download className={styles.download} aria-label={`Descargar ${a.label} (SVG)`}>
              <Icon name="download" size={16} />
              SVG
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function BrandPage() {
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    const prev = document.title;
    document.title = 'Sistema de marca · NEXUS CUBE';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <div className={`container ${styles.barInner}`}>
          <a href="#inicio" aria-label="Volver a NEXUS CUBE">
            <NexusLogo height={28} decorative />
          </a>
          <a href="#inicio" className={styles.back}>
            <Icon name="back" size={16} />
            Volver
          </a>
        </div>
      </header>

      <main id="contenido" className="container">
        <section className={styles.intro}>
          <p className={styles.eyebrow}>Documentación</p>
          <h1 className={styles.h1}>Sistema de marca</h1>
          <p className={styles.lead}>
            Logotipos, colores, tipografía y reglas de uso de NEXUS CUBE y CIPHER AI. Todos los logotipos son SVG
            vectoriales construidos geométricamente. La documentación técnica de la arquitectura se entrega a las
            empresas durante el proceso de acceso.
          </p>
        </section>

        <section className={styles.block} aria-labelledby="b-nexus">
          <div className={styles.blockHead}>
            <h2 id="b-nexus">NEXUS CUBE</h2>
            <p>
              Un cubo isométrico con la N en sus caras frontales. Tres caras visibles: protección multicapa,
              componentes independientes e integridad. La N se recorta sobre las aristas para leerse a cualquier tamaño.
            </p>
          </div>
          <AssetGrid assets={NEXUS_ASSETS} />
        </section>

        <section className={styles.block} aria-labelledby="b-cipher">
          <div className={styles.blockHead}>
            <h2 id="b-cipher">CIPHER AI</h2>
            <p>
              Un núcleo luminoso rodeado por un hexágono de nodos (la silueta del cubo) y un anillo segmentado, como
              una rueda de cifrado. Es inteligencia dentro de la arquitectura, no un asistente genérico.
            </p>
          </div>
          <div className={styles.coreDemo}>
            <CipherCore size={140} state={processing ? 'processing' : 'idle'} label="Núcleo de CIPHER AI animado" />
            <div>
              <p className={styles.coreTitle}>Núcleo animado</p>
              <p className={styles.coreText}>
                En reposo, el anillo gira muy lentamente y el núcleo respira. Al procesar, los datos fluyen por los
                radios hacia el centro. Con «reducir movimiento» activado, el núcleo se muestra estático.
              </p>
              <button type="button" className={styles.toggle} onClick={() => setProcessing((v) => !v)} aria-pressed={processing}>
                {processing ? 'Ver estado en reposo' : 'Ver estado procesando'}
              </button>
            </div>
          </div>
          <AssetGrid assets={CIPHER_ASSETS} />
        </section>

        <section className={styles.block} aria-labelledby="b-color">
          <div className={styles.blockHead}>
            <h2 id="b-color">Paleta</h2>
            <p>Fondos oscuros con contrastes limpios. Los colores derivados existen solo para cumplir el contraste WCAG AA.</p>
          </div>
          <ul className={styles.palette}>
            {PALETTE.map((c) => (
              <li key={c.hex}>
                <span className={styles.swatch} style={{ background: c.hex }} />
                <span className={styles.cName}>{c.name}</span>
                <code className={styles.cHex}>{c.hex}</code>
                <span className={styles.cUse}>{c.use}</span>
              </li>
            ))}
          </ul>
          <ul className={styles.derived}>
            {DERIVED.map((c) => (
              <li key={c.hex}>
                <span className={styles.dot} style={{ background: c.hex }} />
                {c.name} <code>{c.hex}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.block} aria-labelledby="b-type">
          <div className={styles.blockHead}>
            <h2 id="b-type">Tipografía</h2>
            <p>
              Inter para la interfaz y JetBrains Mono para identificadores, código y etiquetas técnicas. Ambas se sirven
              desde el propio sitio, sin peticiones a terceros. El wordmark usa letras geométricas propias.
            </p>
          </div>
          <div className={styles.type}>
            <p className={styles.t1}>Seguridad diseñada, no prometida.</p>
            <p className={styles.t2}>Una nueva arquitectura para proteger la información.</p>
            <p className={styles.t3}>
              Infraestructura de seguridad inteligente diseñada para proteger identidades, información y sistemas.
            </p>
            <p className={styles.t4}>ADVANCED CYBERSECURITY INFRASTRUCTURE · NC-AEAD-1 · 0x2563EB</p>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="b-rules">
          <div className={styles.blockHead}>
            <h2 id="b-rules">Uso</h2>
          </div>
          <ul className={styles.rules}>
            {RULES.map(([k, t]) => (
              <li key={t} data-kind={k}>
                <span>{k}</span>
                {t}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
