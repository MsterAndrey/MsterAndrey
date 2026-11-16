/**
 * Contrato de la consola de administración de la organización (NEXUS Server, aún no existe).
 *
 * Reglas (ADR-0007, ADR-0011):
 * - Administrar personas NO da acceso al contenido de las carpetas: aquí no hay ninguna operación de lectura de datos.
 * - Reducir permisos es inmediato (suspender, retirar acceso, revocar equipo).
 * - Ampliar permisos o hacer acciones delicadas crea una solicitud que deben aprobar OTRAS personas.
 * - Nadie aprueba sus propias solicitudes. Cada aprobación se confirma con Windows Hello.
 */

export type Cargo = 'Socio' | 'Asociado' | 'Asistente';
export type Funcion = 'admin-identidad' | 'custodio' | 'auditor';

export interface Person {
  id: string;
  nombre: string;
  correo: string;
  cargo: Cargo;
  funciones: Funcion[];
  estado: 'activo' | 'suspendido' | 'invitado';
  equipos: number;
  ultimoAcceso: string;
  credencial: 'Llave de seguridad FIDO2' | 'Windows Hello' | 'Pendiente';
}

export interface FolderAccess {
  compartmentId: string;
  carpeta: string;
  responsable: string;
  /** Clientes con los que hay conflicto de intereses (no puede compartir personas). */
  conflictoCon?: string;
  personas: Array<{ personId: string; nombre: string }>;
}

export interface ApprovalRequest {
  id: string;
  tipo: 'acceso' | 'exportacion' | 'baja';
  descripcion: string;
  solicitanteId: string;
  solicitante: string;
  creada: string;
  expira: string;
  requeridas: number;
  aprobaciones: Array<{ nombre: string; cuando: string }>;
  /** Quiénes pueden aprobar (texto para mostrar). */
  aprobadores: string;
  /** Personas autorizadas a aprobar; el servidor lo verifica (nunca incluye a quien solicita). */
  aprobadoresIds: string[];
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface Device {
  id: string;
  personId: string;
  persona: string;
  nombre: string;
  sistema: string;
  tpm: 'verificado' | 'sin verificar';
  ultimoContacto: string;
  estado: 'activo' | 'revocado';
}

export interface AdminEvent {
  id: string;
  cuando: string;
  quien: string;
  que: string;
}

export interface AdminService {
  readonly disponible: boolean;
  /** Persona que usa la consola y sus funciones. */
  me(): Promise<{ id: string; nombre: string; funciones: Funcion[] }>;
  people(): Promise<Person[]>;
  invite(nombre: string, correo: string, cargo: Cargo): Promise<Person>;
  suspend(personId: string): Promise<void>;
  reactivate(personId: string): Promise<ApprovalRequest>;
  requestOffboarding(personId: string): Promise<ApprovalRequest>;
  folders(): Promise<FolderAccess[]>;
  requestAccess(personId: string, compartmentId: string): Promise<ApprovalRequest>;
  revokeAccess(personId: string, compartmentId: string): Promise<void>;
  approvals(): Promise<ApprovalRequest[]>;
  approve(requestId: string): Promise<ApprovalRequest>;
  reject(requestId: string): Promise<ApprovalRequest>;
  devices(): Promise<Device[]>;
  revokeDevice(deviceId: string): Promise<void>;
  log(): Promise<AdminEvent[]>;
}
