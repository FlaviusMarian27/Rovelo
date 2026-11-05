// Tot ce ține de traseu: ruta activă, progresul pe ea (walk) și locurile salvate.
// Progresul stă aici, nu în ecran, ca să nu se piardă când ieși din navigare
// (ex. deschizi camera sau povestea unui loc și te întorci).
//
// Acum generateRoute / replan întorc mock-uri; mai târziu aici vin apelurile spre backend.
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { interests, mockRouteFor } from '@/data/mock';
import type { Route, Stop, WalkPreferences } from '@/types';
import { buildRoute } from '@/utils/geo';

// Aceeași rută cu altă listă / ordine de opriri. Id-ul depinde de ordine,
// deci o rută editată e altă rută (și harta se reîncadrează).
function withStops(route: Route, stops: Stop[]): Route {
  const { title, duration, pace, tags } = route;
  const base = route.id.split(':')[0];
  return buildRoute(
    { id: `${base}:${stops.map((s) => s.id).join(',')}`, title, duration, pace, tags },
    stops,
  );
}

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
  /** Ruta propusă inițial (de "agent"), ca să poți compara și reveni după ce o editezi. */
  suggestedRoute: Route | null;
  /** Noua ordine / listă de opriri, aleasă de tine. Ruta se recalculează. */
  setStops: (stops: Stop[]) => void;
  resetToSuggested: () => void;

  savedRoutes: Route[];
  isRouteSaved: (id: string) => boolean;
  toggleSavedRoute: (route: Route) => void;
  /** Deschide o rută salvată ca rută activă. */
  openRoute: (route: Route) => void;

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
  const [suggestedRoute, setSuggestedRoute] = useState<Route | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);

  async function generateRoute(prefs: WalkPreferences) {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulează "agentul gândește"
    const tags = prefs.interests.map((i) => interests.find((x) => x.id === i)?.label ?? i);
    const route = { ...mockRouteFor(prefs.duration), tags };
    openRoute(route);
    setGenerating(false);
    return route;
  }

  function openRoute(route: Route) {
    setActiveRoute(route);
    setSuggestedRoute(route);
    setWalk(null);
  }

  function setStops(stops: Stop[]) {
    if (activeRoute && stops.length) replaceRoute(withStops(activeRoute, stops));
  }

  function resetToSuggested() {
    if (suggestedRoute) replaceRoute(suggestedRoute);
  }

  function replaceRoute(route: Route) {
    setActiveRoute(route);
    setWalk((w) => (w ? { ...w, routeId: route.id } : w));
  }

  function addStop(stop: Stop) {
    if (!activeRoute) return 'no-route';
    if (activeRoute.stops.some((s) => s.id === stop.id)) return 'exists';
    // Cine creează ruta alege ordinea → noul loc intră la final; se poate muta din Edit.
    replaceRoute(withStops(activeRoute, [...activeRoute.stops, stop]));
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
        suggestedRoute,
        setStops,
        resetToSuggested,
        savedRoutes,
        isRouteSaved: (id) => savedRoutes.some((r) => r.id === id),
        toggleSavedRoute: (route) =>
          setSavedRoutes((list) =>
            list.some((r) => r.id === route.id)
              ? list.filter((r) => r.id !== route.id)
              : [route, ...list],
          ),
        openRoute,
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
