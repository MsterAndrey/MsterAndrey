import { memo } from 'react';
import type { Block, Message } from '../../data/cipherDemo';
import { CipherCore } from '../CipherCore/CipherCore';
import { Icon } from '../Icons/Icon';
import styles from './CipherChat.module.css';

/**
 * Todo el contenido se renderiza como texto de React (escapado automáticamente).
 * No se usa dangerouslySetInnerHTML ni se interpreta markdown/HTML: sin vectores XSS.
 */
function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <p className={styles.text}>{block.text}</p>;
    case 'list':
      return (
        <ul className={styles.bullets}>
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    case 'evidence':
      return (
        <div className={styles.evidence}>
          <p className={styles.evidenceTitle}>{block.title}</p>
          <dl>
            {block.rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case 'code':
      return (
        <pre className={styles.code} aria-label={`Código ${block.language}`}>
          <code>{block.code}</code>
        </pre>
      );
    case 'action':
      return (
        <div className={styles.action} data-effect={block.effect}>
          <div className={styles.actionHead}>
            <span className={styles.actionLabel}>Acción propuesta</span>
            <span className={styles.effect}>{block.effect}</span>
          </div>
          <p className={styles.actionTitle}>{block.title}</p>
          <p className={styles.actionDetail}>{block.detail}</p>
          <button type="button" className={styles.approve} disabled aria-disabled="true">
            <Icon name="key" size={16} />
            Aprobar con llave de seguridad
          </button>
        </div>
      );
  }
}

export const ChatMessage = memo(function ChatMessage({ message }: { message: Message }) {
  const isAI = message.role === 'assistant';
  return (
    <article className={styles.message} data-role={message.role} aria-label={isAI ? 'CIPHER AI' : 'Tú'}>
      {isAI && (
        <div className={styles.avatar} aria-hidden="true">
          <CipherCore size={28} animated={false} />
        </div>
      )}
      <div className={styles.bubble}>
        {isAI && <p className={styles.author}>CIPHER AI <span>· generado por IA</span></p>}
        {message.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>
    </article>
  );
});
