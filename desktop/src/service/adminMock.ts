import type { AdminEvent, AdminService, ApprovalRequest, Device, FolderAccess, Person } from './admin';

/** SIMULACIÓN de la consola de administración. Organización ficticia «Bufete Demo S.A.S.». */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ME = { id: 'p-laura', nombre: 'Laura M.', funciones: ['admin-identidad', 'custodio'] as Person['funciones'] };

const PEOPLE: Person[] = [
  { id: 'p-laura', nombre: 'Laura M.', correo: 'laura.m@bufete-demo.example', cargo: 'Socio', funciones: ['admin-identidad', 'custodio'], estado: 'activo', equipos: 2, ultimoAcceso: 'hace 6 min', credencial: 'Llave de seguridad FIDO2' },
  { id: 'p-ricardo', nombre: 'Ricardo V.', correo: 'ricardo.v@bufete-demo.example', cargo: 'Socio', funciones: ['custodio'], estado: 'activo', equipos: 1, ultimoAcceso: 'hace 2 h', credencial: 'Llave de seguridad FIDO2' },
  { id: 'p-andres', nombre: 'Andrés R.', correo: 'andres.r@bufete-demo.example', cargo: 'Asociado', funciones: [], estado: 'activo', equipos: 1, ultimoAcceso: 'hace 20 min', credencial: 'Windows Hello' },
  { id: 'p-camila', nombre: 'Camila T.', correo: 'camila.t@bufete-demo.example', cargo: 'Asociado', funciones: [], estado: 'activo', equipos: 1, ultimoAcceso: 'hace 1 h', credencial: 'Windows Hello' },
  { id: 'p-jorge', nombre: 'Jorge P.', correo: 'jorge.p@bufete-demo.example', cargo: 'Asistente', funciones: [], estado: 'activo', equipos: 1, ultimoAcceso: 'ayer', credencial: 'Windows Hello' },
  { id: 'p-sofia', nombre: 'Sofía L.', correo: 'sofia.l@bufete-demo.example', cargo: 'Asistente', funciones: ['auditor'], estado: 'activo', equipos: 1, ultimoAcceso: 'hace 3 días', credencial: 'Windows Hello' },
];

const FOLDERS: FolderAccess[] = [
  { compartmentId: 'caso-2026-114', carpeta: 'Caso 2026-114 · Arrendamiento comercial', responsable: 'Laura M.', conflictoCon: 'Constructora Andina',
    personas: [{ personId: 'p-laura', nombre: 'Laura M.' }, { personId: 'p-andres', nombre: 'Andrés R.' }] },
  { compartmentId: 'cliente-andina', carpeta: 'Constructora Andina', responsable: 'Laura M.', conflictoCon: 'Caso 2026-114 · Arrendamiento comercial',
    personas: [{ personId: 'p-laura', nombre: 'Laura M.' }, { personId: 'p-camila', nombre: 'Camila T.' }, { personId: 'p-jorge', nombre: 'Jorge P.' }] },
  { compartmentId: 'caso-2026-131', carpeta: 'Caso 2026-131 · Proceso laboral', responsable: 'Ricardo V.',
    personas: [{ personId: 'p-andres', nombre: 'Andrés R.' }, { personId: 'p-ricardo', nombre: 'Ricardo V.' }] },
];

const APPROVALS: ApprovalRequest[] = [
  { id: 'a1', tipo: 'exportacion', descripcion: 'Exportar «Constructora Andina» para entregarla al cliente', solicitanteId: 'p-camila', solicitante: 'Camila T.',
    creada: 'hoy 09:58', expira: 'mañana 09:58', requeridas: 2, aprobaciones: [{ nombre: 'Ricardo V.', cuando: 'hoy 10:12' }], aprobadores: 'Custodios, excepto quien solicita', aprobadoresIds: ['p-laura', 'p-ricardo'], estado: 'pendiente' },
  { id: 'a2', tipo: 'acceso', descripcion: 'Dar acceso a Jorge P. a «Caso 2026-131 · Proceso laboral»', solicitanteId: 'p-andres', solicitante: 'Andrés R.',
    creada: 'hoy 08:40', expira: 'mañana 08:40', requeridas: 1, aprobaciones: [], aprobadores: 'Socio responsable: Ricardo V.', aprobadoresIds: ['p-ricardo'], estado: 'pendiente' },
  { id: 'a3', tipo: 'acceso', descripcion: 'Dar acceso a Sofía L. a «Caso 2026-114 · Arrendamiento comercial»', solicitanteId: 'p-laura', solicitante: 'Laura M.',
    creada: 'ayer 17:05', expira: 'hoy 17:05', requeridas: 1, aprobaciones: [], aprobadores: 'Otro socio (Laura M. es la responsable y la solicitante)', aprobadoresIds: ['p-ricardo'], estado: 'pendiente' },
];

const DEVICES: Device[] = [
  { id: 'd1', personId: 'p-laura', persona: 'Laura M.', nombre: 'ABOG-PC-014', sistema: 'Windows 11 Pro', tpm: 'verificado', ultimoContacto: 'hace 6 min', estado: 'activo' },
  { id: 'd2', personId: 'p-laura', persona: 'Laura M.', nombre: 'ABOG-LT-003', sistema: 'Windows 11 Pro', tpm: 'verificado', ultimoContacto: 'hace 3 días', estado: 'activo' },
  { id: 'd3', personId: 'p-ricardo', persona: 'Ricardo V.', nombre: 'ABOG-PC-002', sistema: 'Windows 11 Pro', tpm: 'verificado', ultimoContacto: 'hace 2 h', estado: 'activo' },
  { id: 'd4', personId: 'p-andres', persona: 'Andrés R.', nombre: 'ABOG-PC-021', sistema: 'Windows 11 Pro', tpm: 'verificado', ultimoContacto: 'hace 20 min', estado: 'activo' },
  { id: 'd5', personId: 'p-camila', persona: 'Camila T.', nombre: 'ABOG-LT-011', sistema: 'Windows 11 Pro', tpm: 'verificado', ultimoContacto: 'hace 1 h', estado: 'activo' },
  { id: 'd6', personId: 'p-jorge', persona: 'Jorge P.', nombre: 'ABOG-PC-102', sistema: 'Windows 10 Pro', tpm: 'sin verificar', ultimoContacto: 'ayer', estado: 'activo' },
  { id: 'd7', personId: 'p-sofia', persona: 'Sofía L.', nombre: 'ABOG-PC-045', sistema: 'Windows 11 Pro', tpm: 'verificado', ultimoContacto: 'hace 3 días', estado: 'activo' },
];

const LOG: AdminEvent[] = [
  { id: 'l1', cuando: 'hoy 10:12', quien: 'Ricardo V.', que: 'Aprobó (1 de 2) la exportación de «Constructora Andina»' },
  { id: 'l2', cuando: 'hoy 09:58', quien: 'Camila T.', que: 'Solicitó exportar «Constructora Andina»' },
  { id: 'l3', cuando: 'hoy 08:40', quien: 'Andrés R.', que: 'Solicitó acceso para Jorge P. a «Caso 2026-131»' },
  { id: 'l4', cuando: 'ayer 18:05', quien: 'Laura M.', que: 'Pasó «Clínica Salud Norte» a solo lectura (contrato finalizado)' },
];

let seq = 100;
const now = () => 'ahora';
const log = (que: string) => LOG.unshift({ id: `l${++seq}`, cuando: now(), quien: ME.nombre, que });
const person = (id: string) => {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) throw new Error('La persona no existe.');
  return p;
};
const custodiosExcepto = (id: string) => PEOPLE.filter((p) => p.funciones.includes('custodio') && p.id !== id && p.estado === 'activo').map((p) => p.id);
const sociosExcepto = (id: string) => PEOPLE.filter((p) => p.cargo === 'Socio' && p.id !== id && p.estado === 'activo').map((p) => p.id);
const idDe = (nombre: string) => PEOPLE.find((p) => p.nombre === nombre)?.id ?? '';

const newRequest = (r: Omit<ApprovalRequest, 'id' | 'creada' | 'expira' | 'aprobaciones' | 'estado' | 'solicitanteId' | 'solicitante'>) => {
  const req: ApprovalRequest = { ...r, id: `a${++seq}`, creada: now(), expira: 'en 24 h', aprobaciones: [], estado: 'pendiente', solicitanteId: ME.id, solicitante: ME.nombre };
  APPROVALS.unshift(req);
  return req;
};

export const adminMock: AdminService = {
  disponible: true,
  async me() {
    await wait(100);
    return ME;
  },
  async people() {
    await wait(150);
    return PEOPLE.map((p) => ({ ...p }));
  },
  async invite(nombre, correo, cargo) {
    await wait(300);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) throw new Error('El correo no es válido.');
    if (PEOPLE.some((p) => p.correo.toLowerCase() === correo.toLowerCase())) throw new Error('Ya existe una persona con ese correo.');
    const p: Person = { id: `p-${++seq}`, nombre, correo, cargo, funciones: [], estado: 'invitado', equipos: 0, ultimoAcceso: '—', credencial: 'Pendiente' };
    PEOPLE.push(p);
    log(`Invitó a ${nombre} (${cargo}). Deberá registrar su equipo y su credencial; no tiene acceso a ninguna carpeta.`);
    return p;
  },
  async suspend(id) {
    await wait(250);
    const p = person(id);
    if (p.id === ME.id) throw new Error('No puedes suspenderte a ti misma.');
    p.estado = 'suspendido';
    DEVICES.filter((d) => d.personId === id).forEach((d) => (d.estado = 'revocado'));
    log(`Suspendió a ${p.nombre}: sesiones cerradas y equipos sin acceso a claves (inmediato y reversible)`);
  },
  async reactivate(id) {
    await wait(250);
    const p = person(id);
    log(`Solicitó reactivar a ${p.nombre}`);
    const otros = PEOPLE.filter((x) => x.funciones.includes('admin-identidad') && x.id !== ME.id).map((x) => x.id);
    return newRequest({ tipo: 'acceso', descripcion: `Reactivar a ${p.nombre}`, requeridas: 1, aprobadoresIds: otros,
      aprobadores: otros.length ? 'Otro administrador de identidad' : 'Otro administrador de identidad (no hay ninguno: asigna uno con 2 custodios)' });
  },
  async requestOffboarding(id) {
    await wait(250);
    const p = person(id);
    if (p.id === ME.id) throw new Error('No puedes solicitar tu propia baja desde aquí.');
    log(`Solicitó dar de baja a ${p.nombre}`);
    return newRequest({ tipo: 'baja', descripcion: `Dar de baja a ${p.nombre}: retirar todos sus accesos y revocar sus equipos`, requeridas: 2,
      aprobadores: 'Custodios, excepto quien solicita', aprobadoresIds: custodiosExcepto(ME.id) });
  },
  async folders() {
    await wait(150);
    return FOLDERS.map((f) => ({ ...f, personas: [...f.personas] }));
  },
  async requestAccess(personId, compartmentId) {
    await wait(300);
    const p = person(personId);
    const f = FOLDERS.find((x) => x.compartmentId === compartmentId);
    if (!f) throw new Error('La carpeta no existe.');
    if (f.personas.some((x) => x.personId === personId)) throw new Error(`${p.nombre} ya tiene acceso.`);
    if (p.estado !== 'activo') throw new Error(`${p.nombre} no está activo.`);
    const rival = FOLDERS.find((x) => x.carpeta === f.conflictoCon);
    if (rival?.personas.some((x) => x.personId === personId)) {
      throw new Error(`Conflicto de intereses: ${p.nombre} ya trabaja en «${rival.carpeta}», que es contraparte de «${f.carpeta}». La política de la firma lo impide.`);
    }
    log(`Solicitó acceso para ${p.nombre} a «${f.carpeta}»`);
    const propia = f.responsable === ME.nombre;
    return newRequest({ tipo: 'acceso', descripcion: `Dar acceso a ${p.nombre} a «${f.carpeta}»`, requeridas: 1,
      aprobadores: propia ? `Otro socio (${f.responsable} es la responsable y la solicitante)` : `Socio responsable: ${f.responsable}`,
      aprobadoresIds: propia ? sociosExcepto(ME.id) : [idDe(f.responsable)] });
  },
  async revokeAccess(personId, compartmentId) {
    await wait(250);
    const f = FOLDERS.find((x) => x.compartmentId === compartmentId);
    if (!f) throw new Error('La carpeta no existe.');
    const p = person(personId);
    f.personas = f.personas.filter((x) => x.personId !== personId);
    log(`Retiró el acceso de ${p.nombre} a «${f.carpeta}» (inmediato; la clave de la carpeta se rota para los datos nuevos)`);
  },
  async approvals() {
    await wait(150);
    return APPROVALS.map((a) => ({ ...a, aprobaciones: [...a.aprobaciones] }));
  },
  async approve(id) {
    await wait(900);
    const a = APPROVALS.find((x) => x.id === id);
    if (!a || a.estado !== 'pendiente') throw new Error('La solicitud ya no está pendiente.');
    if (a.solicitanteId === ME.id) throw new Error('No puedes aprobar tus propias solicitudes.');
    if (!a.aprobadoresIds.includes(ME.id)) throw new Error(`No estás autorizada para aprobar esta solicitud. Aprueban: ${a.aprobadores}.`);
    if (a.aprobaciones.some((x) => x.nombre === ME.nombre)) throw new Error('Ya aprobaste esta solicitud.');
    a.aprobaciones.push({ nombre: ME.nombre, cuando: now() });
    if (a.aprobaciones.length >= a.requeridas) a.estado = 'aprobada';
    log(`Aprobó (${a.aprobaciones.length} de ${a.requeridas}): ${a.descripcion}`);
    return { ...a };
  },
  async reject(id) {
    await wait(300);
    const a = APPROVALS.find((x) => x.id === id);
    if (!a || a.estado !== 'pendiente') throw new Error('La solicitud ya no está pendiente.');
    a.estado = 'rechazada';
    log(`Rechazó: ${a.descripcion}`);
    return { ...a };
  },
  async devices() {
    await wait(150);
    return DEVICES.map((d) => ({ ...d }));
  },
  async revokeDevice(id) {
    await wait(300);
    const d = DEVICES.find((x) => x.id === id);
    if (!d) throw new Error('El equipo no existe.');
    d.estado = 'revocado';
    log(`Revocó el equipo ${d.nombre} de ${d.persona}: sus claves dejan de servir al reconectarse`);
  },
  async log() {
    await wait(100);
    return [...LOG];
  },
};

/** En la aplicación instalable aún no hay servidor de organización. */
export const adminUnavailable: AdminService = {
  ...adminMock,
  disponible: false,
};
