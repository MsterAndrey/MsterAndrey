import { useCallback, useEffect, useState } from 'react';
import { mockService } from './service/mock';
import { isDesktopApp, realService } from './service/real';
import type { ActivityEvent, Compartment, DeviceStatus, NexusService } from './service/types';
import { Shell, VIEWS, type View } from './components/Shell';
import { Lock } from './screens/Lock';
import { Home } from './screens/Home';
import { Folders } from './screens/Folders';
import { Recovery } from './screens/Recovery';
import { Activity } from './screens/Activity';
import { Device } from './screens/Device';
import { Admin } from './screens/admin/Admin';
import { adminMock, adminUnavailable } from './service/adminMock';

// Dentro de la aplicación de Windows se usa el motor real; en el navegador, la demostración.
const service: NexusService = isDesktopApp ? realService : mockService;
// La consola de administración necesita NEXUS Server (aún no existe): en la app instalable se explica; en la demo, datos ficticios.
const adminService = isDesktopApp ? adminUnavailable : adminMock;

const viewFromHash = (): View => {
  const h = window.location.hash.slice(1);
  return VIEWS.some((v) => v.id === h) ? (h as View) : 'inicio';
};

const PENDING_DEVICE: DeviceStatus = {
  equipo: '…', windows: 'Comprobando…', ultimaSincronizacion: '—', modoSinConexionHasta: null, checks: [],
};

export function App() {
  const [session, setSession] = useState<{ usuario: string; organizacion: string } | null>(null);
  const [view, setView] = useState<View>(viewFromHash);
  const [device, setDevice] = useState<DeviceStatus>(PENDING_DEVICE);
  const [compartments, setCompartments] = useState<Compartment[] | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [restoreFrom, setRestoreFrom] = useState<Compartment | undefined>();

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const reload = useCallback(async () => {
    const [c, a] = await Promise.all([service.listCompartments(), service.recentActivity()]);
    setCompartments(c);
    setActivity(a);
  }, []);

  useEffect(() => {
    if (!session) return;
    reload().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    // El diagnóstico del equipo puede tardar unos segundos (PowerShell): no bloquea la interfaz.
    service.deviceStatus().then(setDevice).catch(() => setDevice({ ...PENDING_DEVICE, windows: 'No se pudo comprobar' }));
  }, [session, reload]);

  const navigate = useCallback((v: View) => {
    setView(v);
    if (window.location.hash !== `#${v}`) window.location.hash = v;
  }, []);

  if (!session) {
    return <Lock modo={service.modo} onUnlock={async () => setSession(await service.unlockWithWindowsHello())} />;
  }

  const lock = () => {
    void service.lock();
    setSession(null);
    setCompartments(null);
  };

  return (
    <Shell modo={service.modo} view={view} onNavigate={navigate} usuario={session.usuario} organizacion={session.organizacion} onLock={lock}>
      {error && <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>}
      {!compartments ? (
        <p role="status">Cargando…</p>
      ) : (
        <>
          {view === 'inicio' && (
            <Home usuario={session.usuario} device={device} compartments={compartments} activity={activity} onNavigate={navigate} />
          )}
          {view === 'carpetas' && (
            <Folders
              service={service}
              compartments={compartments}
              onChanged={reload}
              onRestore={(c) => {
                setRestoreFrom(c);
                navigate('recuperacion');
              }}
            />
          )}
          {view === 'recuperacion' && (
            <Recovery
              key={restoreFrom?.id ?? 'nueva'}
              service={service}
              compartments={compartments}
              initialId={restoreFrom?.id}
              initial={restoreFrom ? `Recupera los archivos de «${restoreFrom.nombre}» como estaban ayer a las 6 de la tarde` : undefined}
            />
          )}
          {view === 'actividad' && <Activity service={service} activity={activity} />}
          {view === 'equipo' && <Device device={device} />}
          {view === 'administracion' && <Admin service={adminService} />}
        </>
      )}
    </Shell>
  );
}
