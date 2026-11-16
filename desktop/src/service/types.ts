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
  archivos: number;
  estado: 'protegida' | 'sincronizando' | 'solo-lectura';
  // Campos que sólo existen con servidor de organización (aún no en la versión local):
  cliente?: string;
  miembros?: Member[];
  tamano?: string;
  retencion?: string;
  ultimaCopia?: string;
}

export interface FileVersion {
  nombre: string;
  modificado: string;
  version: number;
  /** Número de versiones guardadas. */
  versiones?: number;
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
  recibo?: number;
  /** Ruta de la carpeta nueva con lo recuperado (versión real). */
  ubicacion?: string;
  noPresentes?: number;
}

export interface NexusService {
  /** 'demostracion': datos ficticios. 'real': cifrado real con el motor local y el TPM. */
  readonly modo: 'demostracion' | 'real';
  unlockWithWindowsHello(): Promise<{ usuario: string; organizacion: string }>;
  lock(): Promise<void>;
  deviceStatus(): Promise<DeviceStatus>;
  listCompartments(): Promise<Compartment[]>;
  createCompartment(nombre: string, tipo: Compartment['tipo']): Promise<Compartment>;
  /** Abre el selector de archivos y los cifra en la carpeta. Devuelve cuántos se añadieron. */
  addFiles(compartmentId: string): Promise<number>;
  listFiles(compartmentId: string): Promise<FileVersion[]>;
  recentActivity(): Promise<ActivityEvent[]>;
  verifyAuditLog(): Promise<{ resumen: string }>;
  /** Restaura una carpeta tal como estaba en `at`, en una carpeta nueva. Pide Windows Hello en el servicio. */
  restoreAt(compartmentId: string, at: Date, etiqueta: string): Promise<RestoreResult>;
  /** Abre en el Explorador la carpeta con lo recuperado (sólo versión real). */
  reveal?(ubicacion: string): Promise<void>;
  /** Única operación disponible para CIPHER AI (sólo en la demostración por ahora). No modifica nada. */
  proposeRestore(peticion: string): Promise<RestorePlan>;
  prepareRestore(plan: RestorePlan): Promise<PendingAction>;
  confirmWithWindowsHello(action: PendingAction): Promise<RestoreResult>;
}
