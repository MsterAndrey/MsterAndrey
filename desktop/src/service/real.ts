import { invoke } from '@tauri-apps/api/core';
import type { ActivityEvent, Compartment, DeviceStatus, FileVersion, NexusService } from './types';

/**
 * Servicio REAL: llama a los comandos de Rust de la aplicación (desktop/src-tauri).
 * Cifrado con nexus-vault-local, claves en el TPM 2.0 y confirmaciones con Windows Hello en Rust.
 */

type CompartmentDto = { id: string; tipo: 'cliente' | 'caso'; nombre: string; archivos: number };
type FileDto = { nombre: string; version: number; versiones: number; modificado: number; autor: string; tamano: number };
type EventDto = { id: string; cuando: number; quien: string; que: string; categoria: ActivityEvent['categoria']; recibo: number };

const fecha = (unix: number) =>
  new Date(unix * 1000).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const tamano = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`;

const toCompartment = (c: CompartmentDto): Compartment => ({ ...c, estado: 'protegida' });

const noAi = () => Promise.reject(new Error('CIPHER AI todavía no está integrado en la versión instalable.'));

export const realService: NexusService = {
  modo: 'real',
  unlockWithWindowsHello: () => invoke('unlock'),
  lock: () => invoke('lock'),
  deviceStatus: () => invoke<DeviceStatus>('device_status'),
  listCompartments: async () => (await invoke<CompartmentDto[]>('list_compartments')).map(toCompartment),
  createCompartment: async (nombre, tipo) => toCompartment(await invoke<CompartmentDto>('create_compartment', { nombre, tipo })),
  addFiles: (id) => invoke<number>('add_files', { id }),
  listFiles: async (id) =>
    (await invoke<FileDto[]>('list_files', { id })).map(
      (f): FileVersion => ({ nombre: f.nombre, version: f.version, versiones: f.versiones, modificado: fecha(f.modificado), autor: f.autor, tamano: tamano(f.tamano) }),
    ),
  recentActivity: async () =>
    (await invoke<EventDto[]>('activity')).map((e): ActivityEvent => ({ ...e, cuando: fecha(e.cuando) })),
  verifyAuditLog: async () => {
    const r = await invoke<{ entradas: number; detalle: string }>('verify_audit');
    return { resumen: `${r.entradas} entradas, ${r.detalle}` };
  },
  restoreAt: async (id, at, etiqueta) => {
    const r = await invoke<{ restaurados: number; no_presentes: number; carpeta: string; ubicacion: string }>('restore_at', {
      id, at: Math.floor(at.getTime() / 1000), etiqueta,
    });
    return { restaurados: r.restaurados, noPresentes: r.no_presentes, carpeta: r.carpeta, ubicacion: r.ubicacion };
  },
  reveal: (ubicacion) => invoke('reveal', { path: ubicacion }),
  proposeRestore: noAi,
  prepareRestore: noAi,
  confirmWithWindowsHello: noAi,
};

/** ¿Se ejecuta dentro de la aplicación de escritorio (Tauri)? */
export const isDesktopApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
