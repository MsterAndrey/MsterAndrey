import { useCallback, useEffect, useState } from 'react';
import { mockService } from './service/mock';
import type { ActivityEvent, Compartment, DeviceStatus, NexusService } from './service/types';
import { Shell, VIEWS, type View } from './components/Shell';
import { Lock } from './screens/Lock';
import { Home } from './screens/Home';
import { Folders } from './screens/Folders';
import { Recovery } from './screens/Recovery';
import { Activity } from './screens/Activity';
import { Device } from './screens/Device';

// En la Fase 2 este objeto se sustituye por el cliente del servicio local en Rust (vía Tauri).
const service: NexusService = mockService;

const viewFromHash = (): View => {
  const h = window.location.hash.slice(1);
  return VIEWS.some((v) => v.id === h) ? (h as View) : 'inicio';
};

export function App() {
  const [session, setSession] = useState<{ usuario: string; organizacion: string } | null>(null);
  const [view, setView] = useState<View>(viewFromHash);
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [recoveryPrompt, setRecoveryPrompt] = useState<string | undefined>();

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!session) return;
    void Promise.all([service.deviceStatus(), service.listCompartments(), service.recentActivity()]).then(([d, c, a]) => {
      setDevice(d);
      setCompartments(c);
      setActivity(a);
    });
  }, [session]);

  const navigate = useCallback((v: View) => {
    setView(v);
    if (window.location.hash !== `#${v}`) window.location.hash = v;
  }, []);

  if (!session) {
    return <Lock onUnlock={async () => setSession(await service.unlockWithWindowsHello())} />;
  }

  return (
    <Shell view={view} onNavigate={navigate} usuario={session.usuario} organizacion={session.organizacion} onLock={() => setSession(null)}>
      {!device ? (
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
              onCreate={(c) => setCompartments((cs) => [c, ...cs])}
              onRestore={(c) => {
                setRecoveryPrompt(`Recupera los archivos de «${c.nombre}» como estaban ayer a las 6 de la tarde`);
                navigate('recuperacion');
              }}
            />
          )}
          {view === 'recuperacion' && <Recovery key={recoveryPrompt ?? 'nueva'} service={service} initial={recoveryPrompt} />}
          {view === 'actividad' && <Activity service={service} activity={activity} />}
          {view === 'equipo' && <Device device={device} />}
        </>
      )}
    </Shell>
  );
}
