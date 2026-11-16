import { useEffect, useState, type FormEvent } from 'react';
import type { Compartment, FileVersion, NexusService } from '../service/types';
import { Icon } from '../components/Icon';
import { StateChip } from './Home';
import s from './screens.module.css';

type Props = {
  service: NexusService;
  compartments: Compartment[];
  onCreate: (c: Compartment) => void;
  onRestore: (c: Compartment) => void;
};

export function Folders({ service, compartments, onCreate, onRestore }: Props) {
  const [selectedId, setSelectedId] = useState(compartments[0]?.id ?? '');
  const [files, setFiles] = useState<FileVersion[]>([]);
  const [creating, setCreating] = useState(false);
  const selected = compartments.find((c) => c.id === selectedId) ?? compartments[0];

  useEffect(() => {
    if (!selected) return;
    let live = true;
    service.listFiles(selected.id).then((f) => live && setFiles(f));
    return () => {
      live = false;
    };
  }, [service, selected]);

  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nombre = String(data.get('nombre') ?? '').trim();
    if (!nombre) return;
    const tipo = data.get('tipo') === 'caso' ? 'caso' : 'cliente';
    const c: Compartment = {
      id: `nueva-${Date.now()}`, tipo, nombre, cliente: nombre, cifrado: 'Extremo a extremo', archivos: 0, tamano: '0 MB',
      retencion: '10 años', ultimaCopia: 'pendiente', estado: 'protegida', miembros: [{ nombre: 'Laura M.', rol: 'Socio' }],
    };
    onCreate(c);
    setSelectedId(c.id);
    setCreating(false);
  };

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
            <button type="submit" className="btn btn-primary">Crear carpeta cifrada</button>
            <button type="button" className="btn btn-secondary" onClick={() => setCreating(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className={s.split}>
        <div className={s.list}>
          {compartments.map((c) => (
            <button key={c.id} type="button" className={s.folder} aria-pressed={c.id === selected?.id} onClick={() => setSelectedId(c.id)}>
              <span className={s.rowIcon}><Icon name="folderLock" size={18} /></span>
              <span className={s.rowText}>
                <b>{c.nombre}</b>
                <small>{c.tipo === 'caso' ? 'Caso' : 'Cliente'} · {c.archivos} archivos · {c.tamano}</small>
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
                <span className="chip chip-ok"><Icon name="lock" size={13} />{selected.cifrado}</span>
                <StateChip estado={selected.estado} />
              </div>
            </div>
            <dl className={s.facts}>
              <div><dt>Cliente</dt><dd>{selected.cliente}</dd></div>
              <div><dt>Retención de versiones</dt><dd>{selected.retencion}</dd></div>
              <div><dt>Última copia</dt><dd>{selected.ultimaCopia}</dd></div>
              <div><dt>Personas con acceso</dt><dd>{selected.miembros.map((m) => `${m.nombre} (${m.rol})`).join(', ')}</dd></div>
            </dl>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr><th>Archivo</th><th>Versión</th><th>Modificado</th><th>Por</th></tr>
                </thead>
                <tbody>
                  {(selected.archivos === 0 ? [] : files).map((f) => (
                    <tr key={f.nombre}>
                      <td>{f.nombre}</td>
                      <td className="mono">v{f.version}</td>
                      <td>{f.modificado}</td>
                      <td>{f.autor}</td>
                    </tr>
                  ))}
                  {selected.archivos === 0 && (
                    <tr><td colSpan={4}>Carpeta vacía. Arrastra archivos aquí en el Explorador de Windows para cifrarlos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={s.detailActions}>
              <button type="button" className="btn btn-secondary" onClick={() => onRestore(selected)}>
                <Icon name="restore" size={16} />Recuperar una versión anterior
              </button>
              <button type="button" className="btn btn-secondary" disabled title="Requiere aprobación de 2 socios">
                <Icon name="users" size={16} />Exportar (requiere 2 aprobaciones)
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
