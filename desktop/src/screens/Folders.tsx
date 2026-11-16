import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Compartment, FileVersion, NexusService } from '../service/types';
import { Icon } from '../components/Icon';
import { StateChip } from './Home';
import s from './screens.module.css';

type Props = {
  service: NexusService;
  compartments: Compartment[];
  onChanged: () => Promise<void>;
  onRestore: (c: Compartment) => void;
};

export function Folders({ service, compartments, onChanged, onRestore }: Props) {
  const [selectedId, setSelectedId] = useState(compartments[0]?.id ?? '');
  const [files, setFiles] = useState<FileVersion[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = compartments.find((c) => c.id === selectedId) ?? compartments[0];

  const loadFiles = useCallback(async () => {
    if (!selected) return setFiles([]);
    setFiles(await service.listFiles(selected.id));
  }, [service, selected]);

  useEffect(() => {
    void loadFiles().catch((e: unknown) => setError(String(e)));
  }, [loadFiles]);

  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await f();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nombre = String(data.get('nombre') ?? '').trim();
    if (!nombre) return;
    const tipo = data.get('tipo') === 'cliente' ? 'cliente' : 'caso';
    void run(async () => {
      const c = await service.createCompartment(nombre, tipo);
      await onChanged();
      setSelectedId(c.id);
      setCreating(false);
    });
  };

  const addFiles = () =>
    void run(async () => {
      if (!selected) return;
      const n = await service.addFiles(selected.id);
      if (n > 0) {
        await onChanged();
        await loadFiles();
      }
    });

  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1>Carpetas protegidas</h1>
          <p>Una carpeta por cliente o por caso, cada una con su propia clave. Sólo las personas asignadas pueden abrirla; ni NEXUS ni CIPHER AI pueden leer su contenido.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating((v) => !v)}>
          <Icon name="plus" size={16} />Nueva carpeta
        </button>
      </header>

      {error && <p className={s.error} role="alert">{error}</p>}

      {creating && (
        <form className={`panel ${s.form}`} onSubmit={create} aria-label="Nueva carpeta protegida">
          <div className={s.formRow}>
            <label htmlFor="nf-tipo">Tipo
              <select id="nf-tipo" name="tipo" defaultValue="caso">
                <option value="caso">Caso</option>
                <option value="cliente">Cliente</option>
              </select>
            </label>
            <label htmlFor="nf-nombre">Nombre
              <input id="nf-nombre" name="nombre" placeholder="Ej.: Caso 2026-140 · Sucesión" required maxLength={80} />
            </label>
          </div>
          <div className={s.detailActions}>
            <button type="submit" className="btn btn-primary" disabled={busy}>Crear carpeta cifrada</button>
            <button type="button" className="btn btn-secondary" onClick={() => setCreating(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {compartments.length === 0 && !creating && (
        <div className={`panel ${s.section}`}>
          <p className={s.rowText}>Todavía no hay carpetas protegidas. Crea la primera con «Nueva carpeta» y añade archivos de prueba.</p>
        </div>
      )}

      <div className={s.split}>
        <div className={s.list}>
          {compartments.map((c) => (
            <button key={c.id} type="button" className={s.folder} aria-pressed={c.id === selected?.id} onClick={() => setSelectedId(c.id)}>
              <span className={s.rowIcon}><Icon name="folderLock" size={18} /></span>
              <span className={s.rowText}>
                <b>{c.nombre}</b>
                <small>{c.tipo === 'caso' ? 'Caso' : 'Cliente'} · {c.archivos} archivos{c.tamano ? ` · ${c.tamano}` : ''}</small>
              </span>
              <StateChip estado={c.estado} />
            </button>
          ))}
        </div>

        {selected && (
          <section className={`panel ${s.detail}`} aria-label={selected.nombre}>
            <div className={s.detailHead}>
              <span className="eyebrow">{selected.tipo === 'caso' ? 'Caso' : 'Cliente'}</span>
              <h2>{selected.nombre}</h2>
              <div className={s.members}>
                <span className="chip chip-ok"><Icon name="lock" size={13} />Cifrada en este equipo</span>
                <StateChip estado={selected.estado} />
              </div>
            </div>
            {(selected.cliente || selected.retencion || selected.miembros) && (
              <dl className={s.facts}>
                {selected.cliente && <div><dt>Cliente</dt><dd>{selected.cliente}</dd></div>}
                {selected.retencion && <div><dt>Retención de versiones</dt><dd>{selected.retencion}</dd></div>}
                {selected.ultimaCopia && <div><dt>Última copia</dt><dd>{selected.ultimaCopia}</dd></div>}
                {selected.miembros && (
                  <div><dt>Personas con acceso</dt><dd>{selected.miembros.map((m) => `${m.nombre} (${m.rol})`).join(', ')}</dd></div>
                )}
              </dl>
            )}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr><th>Archivo</th><th>Versión</th><th>Modificado</th><th>Por</th></tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.nombre}>
                      <td>{f.nombre}</td>
                      <td className="mono">v{f.version}</td>
                      <td>{f.modificado}</td>
                      <td>{f.autor}</td>
                    </tr>
                  ))}
                  {files.length === 0 && (
                    <tr><td colSpan={4}>Carpeta vacía. Usa «Añadir archivos» para cifrar archivos de prueba.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={s.detailActions}>
              <button type="button" className="btn btn-primary" onClick={addFiles} disabled={busy}>
                <Icon name="plus" size={16} />{busy ? 'Cifrando…' : 'Añadir archivos'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onRestore(selected)} disabled={files.length === 0}>
                <Icon name="restore" size={16} />Recuperar una versión anterior
              </button>
            </div>
            {service.modo === 'real' && (
              <p className={s.note}>Los archivos originales no se borran al añadirlos: decide tú qué hacer con ellos.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
