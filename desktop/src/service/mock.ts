import type {
  ActivityEvent, Compartment, DeviceStatus, FileVersion, NexusService, PendingAction,
} from './types';

/**
 * SIMULACIÓN del servicio local. Todos los datos son ficticios (organización «Bufete Demo S.A.S.»).
 * No hay cifrado, ni Windows Hello, ni acceso a archivos reales.
 */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const COMPARTMENTS: Compartment[] = [
  {
    id: 'caso-2026-114', tipo: 'caso', nombre: 'Caso 2026-114 · Arrendamiento comercial', cliente: 'Inversiones Ribera (ficticio)',
    archivos: 48, tamano: '312 MB', retencion: '10 años', ultimaCopia: 'hace 6 min', estado: 'protegida',
    miembros: [{ nombre: 'Laura M.', rol: 'Socio' }, { nombre: 'Andrés R.', rol: 'Asociado' }],
  },
  {
    id: 'cliente-andina', tipo: 'cliente', nombre: 'Constructora Andina', cliente: 'Constructora Andina (ficticio)',
    archivos: 214, tamano: '1,8 GB', retencion: '10 años', ultimaCopia: 'hace 14 min', estado: 'sincronizando',
    miembros: [{ nombre: 'Laura M.', rol: 'Socio' }, { nombre: 'Camila T.', rol: 'Asociado' }, { nombre: 'Jorge P.', rol: 'Asistente' }],
  },
  {
    id: 'caso-2026-131', tipo: 'caso', nombre: 'Caso 2026-131 · Proceso laboral', cliente: 'Transportes del Valle (ficticio)',
    archivos: 31, tamano: '96 MB', retencion: '10 años', ultimaCopia: 'hace 1 h', estado: 'protegida',
    miembros: [{ nombre: 'Andrés R.', rol: 'Asociado' }],
  },
  {
    id: 'cliente-salud-norte', tipo: 'cliente', nombre: 'Clínica Salud Norte', cliente: 'Clínica Salud Norte (ficticio)',
    archivos: 77, tamano: '420 MB', retencion: '15 años', ultimaCopia: 'ayer', estado: 'solo-lectura',
    miembros: [{ nombre: 'Laura M.', rol: 'Socio' }],
  },
];

const FILES: Record<string, FileVersion[]> = {
  'caso-2026-114': [
    { nombre: 'Contrato_arrendamiento_v3.docx', modificado: 'hoy 10:42', version: 7, autor: 'Laura M.', tamano: '84 KB' },
    { nombre: 'Anexo_inventario.xlsx', modificado: 'hoy 09:15', version: 4, autor: 'Andrés R.', tamano: '41 KB' },
    { nombre: 'Poder_especial_firmado.pdf', modificado: 'ayer 17:20', version: 1, autor: 'Andrés R.', tamano: '1,2 MB' },
    { nombre: 'Correspondencia_arrendador.pdf', modificado: 'ayer 11:03', version: 2, autor: 'Laura M.', tamano: '640 KB' },
    { nombre: 'Notas_reunion_2026-11-10.docx', modificado: '10 nov', version: 3, autor: 'Laura M.', tamano: '22 KB' },
  ],
};

const ACTIVITY: ActivityEvent[] = [
  { id: 'e1', cuando: 'hoy 10:42', quien: 'Laura M.', que: 'Guardó «Contrato_arrendamiento_v3.docx» (versión 7) en Caso 2026-114', categoria: 'acceso', recibo: 48213 },
  { id: 'e2', cuando: 'hoy 10:30', quien: 'Sistema', que: 'Copia de seguridad cifrada completada: 4 carpetas, 0 errores', categoria: 'copia', recibo: 48207 },
  { id: 'e3', cuando: 'hoy 09:58', quien: 'Camila T.', que: 'Solicitó exportar «Constructora Andina»: 1 de 2 aprobaciones', categoria: 'aprobacion', recibo: 48199 },
  { id: 'e4', cuando: 'hoy 09:00', quien: 'NEXUS TRUST', que: 'Registro de auditoría verificado por 3 de 3 testigos', categoria: 'integridad', recibo: 48190 },
  { id: 'e5', cuando: 'ayer 22:14', quien: 'Sistema', que: 'Bloqueado un intento de apertura desde un equipo no inscrito', categoria: 'seguridad', recibo: 48102 },
  { id: 'e6', cuando: 'ayer 18:05', quien: 'Sistema', que: '«Clínica Salud Norte» pasó a solo lectura (contrato finalizado)', categoria: 'seguridad', recibo: 48095 },
];

const DEVICE: DeviceStatus = {
  equipo: 'ABOG-PC-014',
  windows: 'Windows 11 Pro 24H2',
  ultimaSincronizacion: 'hace 6 min',
  modoSinConexionHasta: null,
  checks: [
    { id: 'tpm', titulo: 'TPM 2.0', estado: 'ok', detalle: 'Activo. Las claves de este equipo no se pueden copiar.' },
    { id: 'hello', titulo: 'Windows Hello', estado: 'ok', detalle: 'Huella y PIN configurados.' },
    { id: 'bitlocker', titulo: 'Cifrado de disco (BitLocker)', estado: 'ok', detalle: 'Unidad del sistema protegida.' },
    { id: 'secureboot', titulo: 'Arranque seguro', estado: 'ok', detalle: 'Activado y verificado por atestación.' },
    { id: 'updates', titulo: 'Actualizaciones', estado: 'accion', detalle: 'Hay una actualización de seguridad pendiente de reinicio.' },
  ],
};

let seq = 0;

export const mockService: NexusService = {
  modo: 'demostracion',
  async lock() {},
  async createCompartment(nombre, tipo) {
    await wait(200);
    const c: Compartment = { id: `nueva-${Date.now()}`, tipo, nombre, cliente: nombre, archivos: 0, tamano: '0 MB',
      retencion: '10 años', ultimaCopia: 'pendiente', estado: 'protegida', miembros: [{ nombre: 'Laura M.', rol: 'Socio' }] };
    COMPARTMENTS.unshift(c);
    return c;
  },
  async addFiles(id) {
    await wait(400);
    const list = (FILES[id] ??= []);
    list.unshift({ nombre: `Documento_demo_${list.length + 1}.pdf`, modificado: 'ahora', version: 1, autor: 'Laura M.', tamano: '120 KB' });
    const c = COMPARTMENTS.find((x) => x.id === id);
    if (c) c.archivos += 1;
    return 1;
  },
  async restoreAt(_id, _at, etiqueta) {
    await wait(1600);
    return { restaurados: 2, carpeta: `Restaurado ${etiqueta}`, recibo: 48214 };
  },
  async unlockWithWindowsHello() {
    await wait(900);
    return { usuario: 'Laura M.', organizacion: 'Bufete Demo S.A.S.' };
  },
  async deviceStatus() {
    await wait(150);
    return DEVICE;
  },
  async listCompartments() {
    await wait(150);
    return COMPARTMENTS;
  },
  async listFiles(id) {
    await wait(150);
    const c = COMPARTMENTS.find((x) => x.id === id);
    if (c && c.archivos === 0) return [];
    return FILES[id] ?? FILES['caso-2026-114']!.map((f) => ({ ...f, nombre: f.nombre.replace('arrendamiento', 'documento') }));
  },
  async recentActivity() {
    await wait(150);
    return ACTIVITY;
  },
  async verifyAuditLog() {
    await wait(1200);
    return { resumen: 'punto de control #48213 verificado por 3 de 3 testigos' };
  },
  async proposeRestore(peticion) {
    await wait(300);
    const q = peticion.toLowerCase();
    const c = COMPARTMENTS.find((x) => q.includes('andina') && x.id === 'cliente-andina') ?? COMPARTMENTS[0]!;
    return {
      compartmentId: c.id,
      compartimento: c.nombre,
      puntoEnElTiempo: 'ayer, 15 de noviembre a las 18:00',
      archivos: [
        { nombre: 'Contrato_arrendamiento_v3.docx', cambio: 'Volver a la versión 5 (hoy hay 2 versiones posteriores)' },
        { nombre: 'Anexo_inventario.xlsx', cambio: 'Volver a la versión 3' },
      ],
      destino: 'Nueva carpeta «Restaurado 15-nov 18:00» (las versiones actuales no se tocan)',
      resumen: `Restaurar 2 archivos de «${c.nombre}» al estado del 15 de noviembre a las 18:00 en una carpeta nueva.`,
    };
  },
  async prepareRestore(plan) {
    await wait(200);
    seq += 1;
    const pending: PendingAction = { id: `acc-${seq}`, huella: 'sha256:9f2c…41ab', descripcion: plan.resumen };
    return pending;
  },
  async confirmWithWindowsHello() {
    await wait(1600);
    return { restaurados: 2, carpeta: 'Restaurado 15-nov 18:00', recibo: 48214 };
  },
};
