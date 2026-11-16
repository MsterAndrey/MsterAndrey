import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { AdminEvent, AdminService, ApprovalRequest, Cargo, Device, FolderAccess, Funcion, Person } from '../../service/admin';
import { HelloDialog } from '../../components/HelloDialog';
import { Icon } from '../../components/Icon';
import s from '../screens.module.css';
import a from './Admin.module.css';

type Tab = 'personas' | 'accesos' | 'aprobaciones' | 'equipos' | 'funciones' | 'registro';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'personas', label: 'Personas' },
  { id: 'accesos', label: 'Accesos' },
  { id: 'aprobaciones', label: 'Aprobaciones' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'funciones', label: 'Funciones' },
  { id: 'registro', label: 'Registro' },
];

const FUNCIONES: Record<Funcion, { titulo: string; puede: string; noPuede: string }> = {
  'admin-identidad': {
    titulo: 'Administración de identidad',
    puede: 'Invitar, suspender y solicitar la baja de personas; revocar equipos; solicitar accesos.',
    noPuede: 'Abrir carpetas, aprobar sus propias solicitudes ni dar accesos sin aprobación.',
  },
  custodio: {
    titulo: 'Custodio',
    puede: 'Aprobar exportaciones, bajas y recuperaciones de la organización (siempre con otro custodio).',
    noPuede: 'Actuar solo: toda acción delicada necesita al menos dos custodios.',
  },
  auditor: {
    titulo: 'Auditoría',
    puede: 'Ver el registro de actividad completo y verificar su integridad.',
    noPuede: 'Cambiar personas, accesos ni configuraciones.',
  },
};

const ESTADO_PERSONA = { activo: 'chip-ok', suspendido: 'chip-bloqueante', invitado: 'chip-info' } as const;
const TIPO = { acceso: 'Acceso', exportacion: 'Exportación', baja: 'Baja' } as const;

export function Admin({ service }: { service: AdminService }) {
  const [tab, setTab] = useState<Tab>('personas');
  const [me, setMe] = useState<{ id: string; nombre: string; funciones: Funcion[] } | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [folders, setFolders] = useState<FolderAccess[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [log, setLog] = useState<AdminEvent[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [helloFor, setHelloFor] = useState<ApprovalRequest | null>(null);

  const reload = useCallback(async () => {
    const [m, p, f, ap, d, l] = await Promise.all([
      service.me(), service.people(), service.folders(), service.approvals(), service.devices(), service.log(),
    ]);
    setMe(m); setPeople(p); setFolders(f); setApprovals(ap); setDevices(d); setLog(l);
  }, [service]);

  useEffect(() => {
    if (service.disponible) void reload();
  }, [service, reload]);

  const act = async (f: () => Promise<string>) => {
    setMsg(null);
    try {
      setMsg({ ok: true, text: await f() });
      await reload();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setConfirming(null);
    }
  };

  if (!service.disponible) {
    return (
      <div className={s.page}>
        <header className={s.head}><div><h1>Administración</h1></div></header>
        <div className={`panel ${s.section}`}>
          <p className={s.rowText}>
            La administración de personas y accesos de la organización necesita el servidor de NEXUS CUBE, que todavía no existe.
            En esta versión cada equipo funciona de forma local. Puedes ver cómo será la consola en el prototipo navegable.
          </p>
        </div>
      </div>
    );
  }

  const pendientes = approvals.filter((x) => x.estado === 'pendiente');

  return (
    <div className={s.page}>
      <header className={s.head}>
        <div>
          <h1>Administración</h1>
          <p>Personas y accesos de Bufete Demo S.A.S. Administrar no da acceso al contenido de las carpetas, y nadie aprueba sus propias solicitudes.</p>
        </div>
        {me && (
          <span className={a.me}>
            <Icon name="shield" size={16} />{me.nombre} · {me.funciones.map((f) => FUNCIONES[f].titulo).join(' · ')}
          </span>
        )}
      </header>

      <div className={a.tabs} role="tablist" aria-label="Secciones de administración">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={a.tab} onClick={() => { setTab(t.id); setMsg(null); }}>
            {t.label}
            {t.id === 'aprobaciones' && pendientes.length > 0 && <span className={a.badge}>{pendientes.length}</span>}
          </button>
        ))}
      </div>

      {msg && <p className={msg.ok ? a.ok : s.error} role="status">{msg.text}</p>}

      {tab === 'personas' && (
        <>
          <InviteForm onInvite={(n, c, cargo) => act(async () => { await service.invite(n, c, cargo); return `Invitación enviada a ${n}. No tendrá acceso a ninguna carpeta hasta que se apruebe.`; })} />
          <section className={`panel ${s.section}`} aria-label="Personas">
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead><tr><th>Persona</th><th>Cargo</th><th>Estado</th><th>Credencial</th><th>Último acceso</th><th /></tr></thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id}>
                      <td><b>{p.nombre}</b><br /><small className={a.muted}>{p.correo}</small></td>
                      <td>{p.cargo}{p.funciones.length > 0 && <><br /><small className={a.muted}>{p.funciones.map((f) => FUNCIONES[f].titulo).join(', ')}</small></>}</td>
                      <td><span className={`chip ${ESTADO_PERSONA[p.estado]}`}>{p.estado}</span></td>
                      <td>{p.credencial}</td>
                      <td>{p.ultimoAcceso}</td>
                      <td className={a.actions}>
                        {p.id !== me?.id && p.estado === 'activo' && (
                          confirming === `susp-${p.id}`
                            ? <button type="button" className="btn btn-secondary" onClick={() => void act(async () => { await service.suspend(p.id); return `${p.nombre} suspendido: sus sesiones y equipos quedaron sin acceso.`; })}>Confirmar suspensión</button>
                            : <button type="button" className="btn btn-secondary" onClick={() => setConfirming(`susp-${p.id}`)}>Suspender</button>
                        )}
                        {p.estado === 'suspendido' && (
                          <button type="button" className="btn btn-secondary" onClick={() => void act(async () => { await service.reactivate(p.id); return `Solicitud de reactivación creada: debe aprobarla otro administrador.`; })}>Solicitar reactivación</button>
                        )}
                        {p.id !== me?.id && p.estado !== 'invitado' && (
                          <button type="button" className="btn btn-secondary" onClick={() => void act(async () => { await service.requestOffboarding(p.id); return `Solicitud de baja de ${p.nombre} creada: necesita 2 custodios.`; })}>Solicitar baja</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === 'accesos' && (
        <div className={a.grid}>
          {folders.map((f) => (
            <section key={f.compartmentId} className={`panel ${a.folder}`} aria-label={f.carpeta}>
              <div>
                <h2>{f.carpeta}</h2>
                <p className={a.muted}>Responsable: {f.responsable}</p>
                {f.conflictoCon && <p className={a.conflict}><Icon name="alert" size={14} />Conflicto de intereses con «{f.conflictoCon}»: nadie puede trabajar en ambas.</p>}
              </div>
              <ul className={a.members}>
                {f.personas.map((p) => (
                  <li key={p.personId}>
                    <span>{p.nombre}</span>
                    {confirming === `rev-${f.compartmentId}-${p.personId}`
                      ? <button type="button" className="btn btn-secondary" onClick={() => void act(async () => { await service.revokeAccess(p.personId, f.compartmentId); return `Acceso de ${p.nombre} retirado de inmediato.`; })}>Confirmar</button>
                      : <button type="button" className={a.link} onClick={() => setConfirming(`rev-${f.compartmentId}-${p.personId}`)}>Retirar</button>}
                  </li>
                ))}
              </ul>
              <GrantForm
                id={f.compartmentId}
                candidates={people.filter((p) => p.estado === 'activo' && !f.personas.some((x) => x.personId === p.id))}
                onRequest={(personId) => act(async () => { await service.requestAccess(personId, f.compartmentId); return 'Solicitud de acceso creada. Queda pendiente de la aprobación del socio responsable.'; })}
              />
            </section>
          ))}
        </div>
      )}

      {tab === 'aprobaciones' && (
        <section className={a.requests} aria-label="Solicitudes">
          {approvals.map((r) => {
            const propia = r.solicitanteId === me?.id;
            const yaAprobe = r.aprobaciones.some((x) => x.nombre === me?.nombre);
            const puede = !propia && !yaAprobe && !!me && r.aprobadoresIds.includes(me.id);
            const esperando = people.filter((p) => r.aprobadoresIds.includes(p.id) && !r.aprobaciones.some((x) => x.nombre === p.nombre)).map((p) => p.nombre);
            return (
              <article key={r.id} className={`panel ${a.request}`} data-estado={r.estado}>
                <div className={a.requestHead}>
                  <span className="chip chip-ai">{TIPO[r.tipo]}</span>
                  <span className={`chip ${r.estado === 'pendiente' ? 'chip-accion' : r.estado === 'aprobada' ? 'chip-ok' : 'chip-bloqueante'}`}>{r.estado}</span>
                  <span className={a.muted}>{r.creada} · vence {r.expira}</span>
                </div>
                <h2>{r.descripcion}</h2>
                <p className={a.muted}>Solicitó: {r.solicitante} · Aprueban: {r.aprobadores}</p>
                <div className={a.progress} aria-label={`${r.aprobaciones.length} de ${r.requeridas} aprobaciones`}>
                  {Array.from({ length: r.requeridas }, (_, i) => (
                    <span key={i} data-done={i < r.aprobaciones.length}>{r.aprobaciones[i]?.nombre ?? 'Pendiente'}</span>
                  ))}
                </div>
                {r.estado === 'pendiente' && (
                  <div className={s.detailActions}>
                    {puede && <button type="button" className="btn btn-primary" onClick={() => setHelloFor(r)}><Icon name="hello" size={16} />Aprobar con Windows Hello</button>}
                    {puede && <button type="button" className="btn btn-secondary" onClick={() => void act(async () => { await service.reject(r.id); return 'Solicitud rechazada.'; })}>Rechazar</button>}
                    {!puede && (
                      <p className={a.muted}>
                        {propia ? 'Es tu propia solicitud: debe aprobarla otra persona. ' : yaAprobe ? 'Ya la aprobaste. ' : 'No te corresponde aprobarla. '}
                        {esperando.length > 0 ? `Esperando a: ${esperando.join(', ')}.` : 'No hay ninguna persona habilitada para aprobarla.'}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {tab === 'equipos' && (
        <section className={`panel ${s.section}`} aria-label="Equipos">
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>Equipo</th><th>Persona</th><th>Sistema</th><th>TPM</th><th>Último contacto</th><th>Estado</th><th /></tr></thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td className="mono">{d.nombre}</td>
                    <td>{d.persona}</td>
                    <td>{d.sistema}</td>
                    <td><span className={`chip ${d.tpm === 'verificado' ? 'chip-ok' : 'chip-accion'}`}>{d.tpm}</span></td>
                    <td>{d.ultimoContacto}</td>
                    <td><span className={`chip ${d.estado === 'activo' ? 'chip-ok' : 'chip-bloqueante'}`}>{d.estado}</span></td>
                    <td className={a.actions}>
                      {d.estado === 'activo' && (confirming === `dev-${d.id}`
                        ? <button type="button" className="btn btn-secondary" onClick={() => void act(async () => { await service.revokeDevice(d.id); return `Equipo ${d.nombre} revocado: sus claves dejan de servir al reconectarse.`; })}>Confirmar</button>
                        : <button type="button" className="btn btn-secondary" onClick={() => setConfirming(`dev-${d.id}`)}>Revocar</button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={s.note}>Revoca un equipo si se pierde o lo roban. La persona sigue activa y puede registrar otro.</p>
        </section>
      )}

      {tab === 'funciones' && (
        <div className={a.grid}>
          {(Object.keys(FUNCIONES) as Funcion[]).map((f) => (
            <section key={f} className={`panel ${a.folder}`}>
              <h2>{FUNCIONES[f].titulo}</h2>
              <p><b>Puede:</b> {FUNCIONES[f].puede}</p>
              <p><b>No puede:</b> {FUNCIONES[f].noPuede}</p>
              <p className={a.muted}>Personas: {people.filter((p) => p.funciones.includes(f)).map((p) => p.nombre).join(', ') || 'nadie'}</p>
            </section>
          ))}
          <section className={`panel ${a.folder}`}>
            <h2>Nadie lo puede todo</h2>
            <p>No existe un administrador con acceso total. Cambiar estas funciones requiere la aprobación de dos custodios y queda registrado.</p>
          </section>
        </div>
      )}

      {tab === 'registro' && (
        <section className={`panel ${s.section}`} aria-label="Registro de administración">
          <ul className={s.events}>
            {log.map((e) => (
              <li key={e.id} className={s.event}>
                <span className={s.rowIcon}><Icon name="tree" size={18} /></span>
                <span className={s.rowText}><b>{e.que}</b><small>{e.cuando} · {e.quien}</small></span>
                <span />
              </li>
            ))}
          </ul>
        </section>
      )}

      {helloFor && (
        <HelloDialog
          motivo={`Aprobar: ${helloFor.descripcion}`}
          huella="sha256:4be1…c09d"
          onCancel={() => setHelloFor(null)}
          onConfirm={async () => {
            const r = helloFor;
            setHelloFor(null);
            await act(async () => {
              const res = await service.approve(r.id);
              return res.estado === 'aprobada' ? 'Solicitud aprobada y ejecutada.' : `Aprobación registrada (${res.aprobaciones.length} de ${res.requeridas}).`;
            });
          }}
        />
      )}
    </div>
  );
}

function InviteForm({ onInvite }: { onInvite: (nombre: string, correo: string, cargo: Cargo) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    void onInvite(String(d.get('nombre')).trim(), String(d.get('correo')).trim(), d.get('cargo') as Cargo).then(() => setOpen(false));
  };
  if (!open) {
    return <div><button type="button" className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={16} />Invitar a una persona</button></div>;
  }
  return (
    <form className={`panel ${s.form}`} onSubmit={submit} aria-label="Invitar a una persona">
      <div className={a.inviteRow}>
        <label htmlFor="inv-nombre">Nombre<input id="inv-nombre" name="nombre" required maxLength={80} /></label>
        <label htmlFor="inv-correo">Correo corporativo<input id="inv-correo" name="correo" type="email" required maxLength={120} /></label>
        <label htmlFor="inv-cargo">Cargo
          <select id="inv-cargo" name="cargo" defaultValue="Asociado">
            <option>Socio</option><option>Asociado</option><option>Asistente</option>
          </select>
        </label>
      </div>
      <p className={s.note}>La persona recibirá una invitación para registrar su equipo (con TPM 2.0) y su credencial. No tendrá acceso a ninguna carpeta hasta que se apruebe.</p>
      <div className={s.detailActions}>
        <button type="submit" className="btn btn-primary">Enviar invitación</button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </form>
  );
}

function GrantForm({ id, candidates, onRequest }: { id: string; candidates: Person[]; onRequest: (personId: string) => Promise<void> }) {
  const [sel, setSel] = useState('');
  if (candidates.length === 0) return null;
  return (
    <form className={a.grant} onSubmit={(e) => { e.preventDefault(); if (sel) void onRequest(sel).then(() => setSel('')); }}>
      <label htmlFor={`grant-${id}`} className="visually-hidden">Persona</label>
      <select id={`grant-${id}`} value={sel} onChange={(e) => setSel(e.target.value)}>
        <option value="">Dar acceso a…</option>
        {candidates.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.cargo})</option>)}
      </select>
      <button type="submit" className="btn btn-secondary" disabled={!sel}>Solicitar</button>
    </form>
  );
}
