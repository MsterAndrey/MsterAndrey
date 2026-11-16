/**
 * Contrato entre la interfaz de NEXUS CUBE Desktop y el servicio local (Rust).
 *
 * Reglas de diseño (docs/17, ADR-0004, ADR-0008):
 * - La interfaz NUNCA recibe claves ni fragmentos de recuperación: sólo estados y resultados.
 * - Las operaciones con efecto (restaurar, compartir, exportar) devuelven un `PendingAction`
 *   que sólo se ejecuta tras `confirmWithWindowsHello` (biometría local, hash de la acción).
 * - CIPHER AI sólo puede llamar a `proposeRestore`: propone, nunca ejecuta.
 */

export type CheckState = 'ok' | 'accion' | 'bloqueante' | 'desconocido';

export interface DeviceStatus {
  equipo: string;
  windows: string;
  checks: Array<{ id: string; titulo: string; estado: CheckState; detalle: string }>;
  ultimaSincronizacion: string;
  modoSinConexionHasta: string | null;
}

export interface Member {
  nombre: string;
  rol: 'Socio' | 'Asociado' | 'Asistente';
}

export interface Compartment {
  id: string;
  tipo: 'cliente' | 'caso';
  nombre: string;
  cliente: string;
  cifrado: 'Extremo a extremo';
  miembros: Member[];
  archivos: number;
  tamano: string;
  retencion: string;
  ultimaCopia: string;
  estado: 'protegida' | 'sincronizando' | 'solo-lectura';
}

export interface FileVersion {
  nombre: string;
  modificado: string;
  version: number;
  autor: string;
  tamano: string;
}

export interface ActivityEvent {
  id: string;
  cuando: string;
  quien: string;
  que: string;
  categoria: 'acceso' | 'copia' | 'aprobacion' | 'integridad' | 'seguridad';
  /** Índice de la hoja en el registro NEXUS TRUST (recibo verificable). */
  recibo: number;
}

export interface RestorePlan {
  compartmentId: string;
  compartimento: string;
  puntoEnElTiempo: string;
  archivos: Array<{ nombre: string; cambio: string }>;
  destino: string;
  /** Qué se ejecutará, en lenguaje claro. Es lo que la persona firma con Windows Hello. */
  resumen: string;
}

export interface PendingAction {
  id: string;
  /** Huella (hash) de la acción literal que se confirma. */
  huella: string;
  descripcion: string;
}

export interface RestoreResult {
  restaurados: number;
  carpeta: string;
  recibo: number;
}

export interface NexusService {
  unlockWithWindowsHello(): Promise<{ usuario: string; organizacion: string }>;
  deviceStatus(): Promise<DeviceStatus>;
  listCompartments(): Promise<Compartment[]>;
  listFiles(compartmentId: string): Promise<FileVersion[]>;
  recentActivity(): Promise<ActivityEvent[]>;
  verifyAuditLog(): Promise<{ checkpoint: number; testigos: string }>;
  /** Única operación disponible para CIPHER AI. No modifica nada. */
  proposeRestore(peticion: string): Promise<RestorePlan>;
  prepareRestore(plan: RestorePlan): Promise<PendingAction>;
  confirmWithWindowsHello(action: PendingAction): Promise<RestoreResult>;
}
