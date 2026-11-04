// Tot ce ține de traseu: ruta activă, progresul pe ea (walk) și locurile salvate.
// Progresul stă aici, nu în ecran, ca să nu se piardă când ieși din navigare
// (ex. deschizi camera sau povestea unui loc și te întorci).
//
// Acum generateRoute / replan întorc mock-uri; mai târziu aici vin apelurile spre backend.
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { mockRouteFor } from '@/data/mock';
import type { Route, Stop, WalkPreferences } from '@/types';
import { buildRoute } from '@/utils/geo';

export type WalkPhase = 'walking' | 'arrived' | 'finished';

export type WalkState = {
  routeId: string;
  index: number; // oprirea spre care mergi / la care ești
  phase: WalkPhase;
  startedAt: number | null; // ceasul pornește când ajungi la prima oprire
  demo: boolean;
  delayMin: number; // întârziere simulată (doar demo)
  snoozedLate: number | null; // "Not now" la banner: nu-l mai arătăm până nu crește întârzierea
};

const newWalk = (routeId: string): WalkState => ({
  routeId,
  index: 0,
  phase: 'walking',
  startedAt: null,
  demo: false,
  delayMin: 0,
  snoozedLate: null,
});

type RouteState = {
  activeRoute: Route | null;
  generating: boolean;
  generateRoute: (prefs: WalkPreferences) => Promise<Route>;
  clearRoute: () => void;
  /** Înlocuiește ruta (după Replan / Add to route) fără să piardă progresul. */
  replaceRoute: (route: Route) => void;
  addStop: (stop: Stop) => 'added' | 'exists' | 'no-route';

  walk: WalkState | null;
  beginWalk: () => void;
  arrive: () => void;
  nextStop: () => void;
  endWalk: () => void;
  setDemo: (demo: boolean) => void;
  addDelay: (min: number) => void;
  snoozeLate: (lateMin: number) => void;

  savedPlaces: string[];
  toggleSavedPlace: (id: string) => void;
};

const RouteContext = createContext<RouteState | null>(null);

export function RouteProvider({ children }: PropsWithChildren) {
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [generating, setGenerating] = useState(false);
  const [walk, setWalk] = useState<WalkState | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);

  async function generateRoute(prefs: WalkPreferences) {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulează "agentul gândește"
    const route = mockRouteFor(prefs.duration);
    setActiveRoute(route);
    setWalk(null);
    setGenerating(false);
    return route;
  }

  function replaceRoute(route: Route) {
    setActiveRoute(route);
    setWalk((w) => (w ? { ...w, routeId: route.id } : w));
  }

  function addStop(stop: Stop) {
    if (!activeRoute) return 'no-route';
    if (activeRoute.stops.some((s) => s.id === stop.id)) return 'exists';
    // Cine creează ruta alege ordinea → noul loc intră la final; se poate muta mai târziu.
    const { id, title, duration, pace } = activeRoute;
    replaceRoute(
      buildRoute({ id: `${id}+${stop.id}`, title, duration, pace }, [...activeRoute.stops, stop]),
    );
    return 'added';
  }

  // Pornește (sau continuă) mersul pe ruta activă.
  function beginWalk() {
    if (!activeRoute) return;
    setWalk((w) => (w && w.routeId === activeRoute.id ? w : newWalk(activeRoute.id)));
  }

  const update = (fn: (w: WalkState) => WalkState) => setWalk((w) => (w ? fn(w) : w));

  const arrive = () =>
    update((w) => ({ ...w, phase: 'arrived', startedAt: w.startedAt ?? Date.now() }));

  const nextStop = () =>
    update((w) => {
      const last = (activeRoute?.stops.length ?? 1) - 1;
      if (w.index >= last) return { ...w, phase: 'finished' };
      return { ...w, index: w.index + 1, phase: 'walking' };
    });

  return (
    <RouteContext.Provider
      value={{
        activeRoute,
        generating,
        generateRoute,
        clearRoute: () => {
          setActiveRoute(null);
          setWalk(null);
        },
        replaceRoute,
        addStop,
        walk,
        beginWalk,
        arrive,
        nextStop,
        endWalk: () => setWalk(null),
        setDemo: (demo) => update((w) => ({ ...w, demo, delayMin: demo ? w.delayMin : 0 })),
        addDelay: (min) => update((w) => ({ ...w, delayMin: w.delayMin + min, snoozedLate: null })),
        snoozeLate: (lateMin) => update((w) => ({ ...w, snoozedLate: lateMin })),
        savedPlaces,
        toggleSavedPlace: (id) =>
          setSavedPlaces((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
      }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRoute must be used inside RouteProvider');
  return ctx;
}
