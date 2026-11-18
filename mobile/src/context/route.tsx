// Tot ce ține de traseu: ruta activă, progresul pe ea (walk) și locurile salvate.
// Progresul stă aici, nu în ecran, ca să nu se piardă când ieși din navigare
// (ex. deschizi camera sau povestea unui loc și te întorci).
//
// Rutele salvate stau pe server (pentru cont); pentru Guest doar în memorie.
// generateRoute vine din backend (locuri reale din OpenStreetMap); replan e încă local.
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

import { useSession } from '@/context/session';
import {
  deleteSavedPlace,
  listSavedPlaces,
  savePlace,
  type PlaceSnapshot,
} from '@/services/places-api';
import { planRoute, toStop } from '@/services/planner-api';
import { fetchWalk } from '@/services/walk-api';
import {
  deleteSavedRoute,
  listSavedRoutes,
  saveRoute,
  updateSavedRoute,
} from '@/services/routes-api';
import type { Coord, Route, Stop, WalkPreferences } from '@/types';
import { buildRoute, distanceMeters, withStreets } from '@/utils/geo';
import i18n from '@/i18n';

/**
 * Id-ul "de familie" al unei rute: "gen-123:osm:node/1,…" → "gen-123". O rută editată (altă ordine,
 * opriri scoase / adăugate) primește alt id, dar rămâne aceeași rută salvată.
 */
export const routeBaseId = (id: string) => id.split(':')[0];

// Aceeași rută cu altă listă / ordine de opriri. Id-ul depinde de ordine,
// deci o rută editată e altă rută (și harta se reîncadrează).
// Cât de departe de oraș poți fi ca ruta să pornească de la tine (altfel: din centrul orașului ales).
const SAME_CITY_M = 25_000;

// De unde pornește ruta: de la tine (GPS). Fără GPS, sau dacă ești în alt oraș decât cel ales,
// din centrul orașului.
async function startCoord(prefs: WalkPreferences): Promise<Coord> {
  if (prefs.start.coord) return prefs.start.coord;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      if (distanceMeters(here, prefs.city.coord) <= SAME_CITY_M) return here;
    }
  } catch {
    // fără GPS → centrul orașului
  }
  return prefs.city.coord;
}

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
  /** null = n-a mers (eroarea e deja afișată). */
  generateRoute: (prefs: WalkPreferences) => Promise<Route | null>;
  clearRoute: () => void;
  /** Înlocuiește ruta (după Replan / Add to route) fără să piardă progresul. */
  replaceRoute: (route: Route) => void;
  /** Fără rută activă, începe una nouă (a ta) cu locul ăsta. */
  addStop: (stop: Stop) => 'added' | 'exists' | 'created';
  /** Ruta propusă inițial (de "agent"), ca să poți compara și reveni după ce o editezi. */
  suggestedRoute: Route | null;
  /** Noua ordine / listă de opriri, aleasă de tine. Ruta se recalculează. */
  setStops: (stops: Stop[]) => void;
  resetToSuggested: () => void;
  /** Numele rutei active (și al copiei salvate, dacă e salvată). */
  renameRoute: (title: string) => void;

  savedRoutes: Route[];
  /** true cât se încarcă lista de pe server. */
  savedLoading: boolean;
  reloadSaved: () => Promise<void>;
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

  /** Locurile salvate (pe server pentru cont; Guest local), cele mai noi primele. */
  savedPlaces: PlaceSnapshot[];
  isPlaceSaved: (id: string) => boolean;
  toggleSavedPlace: (place: PlaceSnapshot) => void;
};

const RouteContext = createContext<RouteState | null>(null);

export function RouteProvider({ children }: PropsWithChildren) {
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [generating, setGenerating] = useState(false);
  const [walk, setWalk] = useState<WalkState | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<PlaceSnapshot[]>([]);
  const [suggestedRoute, setSuggestedRoute] = useState<Route | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  // routeBaseId(ruta din aplicație) → id-ul ei pe server (ca s-o putem actualiza / șterge)
  const serverIds = useRef<Record<string, string>>({});
  const isSaved = (id: string) => savedRoutes.some((r) => routeBaseId(r.id) === routeBaseId(id));

  const { user, token } = useSession();
  const online = !!token && !!user && !user.isGuest;

  async function reloadSaved() {
    if (!online) return;
    setSavedLoading(true);
    try {
      const [routes, places] = await Promise.all([
        listSavedRoutes(token!),
        listSavedPlaces(token!),
      ]);
      serverIds.current = Object.fromEntries(routes.map((e) => [routeBaseId(e.route.id), e.id]));
      setSavedRoutes(routes.map((e) => e.route));
      setSavedPlaces(places.map((e) => e.place));
    } catch {
      // fără rețea: rămâne ce aveam; ecranul Saved poate reîncerca
    } finally {
      setSavedLoading(false);
    }
  }

  // La login (provider-ul se recreează pentru fiecare user) încărcăm rutele de pe server.
  useEffect(() => {
    reloadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Salvare / ștergere: actualizăm imediat lista, apoi serverul; la eroare revenim.
  async function toggleSavedRoute(route: Route) {
    const base = routeBaseId(route.id);
    const wasSaved = isSaved(route.id);
    const before = savedRoutes;
    setSavedRoutes(
      wasSaved ? before.filter((r) => routeBaseId(r.id) !== base) : [route, ...before],
    );
    if (!online) return; // Guest: doar local

    try {
      if (wasSaved) {
        const serverId = serverIds.current[base];
        if (serverId) await deleteSavedRoute(token!, serverId);
        delete serverIds.current[base];
      } else {
        const entry = await saveRoute(token!, route);
        serverIds.current[base] = entry.id;
      }
    } catch (e) {
      setSavedRoutes(before);
      Alert.alert(
        i18n.t(wasSaved ? 'route.removeFailed' : 'route.saveFailed'),
        e instanceof Error ? e.message : i18n.t('route.tryAgain'),
      );
    }
  }

  async function toggleSavedPlace(place: PlaceSnapshot) {
    const wasSaved = savedPlaces.some((p) => p.id === place.id);
    const before = savedPlaces;
    setSavedPlaces(wasSaved ? before.filter((p) => p.id !== place.id) : [place, ...before]);
    if (!online) return; // Guest: doar local

    try {
      if (wasSaved) await deleteSavedPlace(token!, place.id);
      else await savePlace(token!, place);
    } catch (e) {
      setSavedPlaces(before);
      Alert.alert(
        i18n.t(wasSaved ? 'place.removeFailed' : 'place.saveFailed'),
        e instanceof Error ? e.message : i18n.t('route.tryAgain'),
      );
    }
  }

  // Drumul real pe străzi: după fiecare schimbare de opriri (generare, reordonare, Add to route,
  // replan, rută salvată veche) cerem traseul de la backend. Până vine, rămâne estimarea.
  useEffect(() => {
    const route = activeRoute;
    if (!route || route.streets || route.stops.length < 2) return;
    let cancelled = false;
    fetchWalk(
      route.stops.map((s) => s.coord),
      online ? token : null,
    )
      .then((walk) => {
        if (cancelled) return;
        const better = withStreets(route, walk);
        setActiveRoute((cur) => (cur?.id === route.id ? better : cur));
        setSuggestedRoute((cur) => (cur?.id === route.id ? better : cur));
      })
      .catch(() => {}); // fără rutare → rămâne estimarea, aplicația merge mai departe
    return () => {
      cancelled = true;
    };
  }, [activeRoute, online, token]);

  async function generateRoute(prefs: WalkPreferences) {
    setGenerating(true);
    try {
      const start = await startCoord(prefs);
      const plan = await planRoute(
        { start, duration: prefs.duration, interests: prefs.interests },
        online ? token : null,
      );
      const stops: Stop[] = plan.stops.map(toStop);
      const route = buildRoute(
        {
          id: `gen-${Date.now()}`,
          title: i18n.t('route.generatedTitle', { city: prefs.city.name }),
          duration: prefs.duration,
          pace: i18n.t('route.pace'),
          tags: prefs.interests.map((i) => i18n.t(`interests.${i}`)),
        },
        stops,
      );
      openRoute(route);
      return route;
    } catch (e) {
      Alert.alert(i18n.t('route.generateFailed'), e instanceof Error ? e.message : '');
      return null;
    } finally {
      setGenerating(false);
    }
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

  function renameRoute(title: string) {
    const name = title.trim().slice(0, 60);
    if (!activeRoute || !name || name === activeRoute.title) return;
    // id-ul rămâne același → progresul și drumul pe străzi rămân; copia salvată se actualizează singură
    setActiveRoute({ ...activeRoute, title: name });
    setSuggestedRoute((cur) => (cur?.id === activeRoute.id ? { ...cur, title: name } : cur));
  }

  // Ruta activă e salvată și s-a schimbat (opriri, ordine, nume, drumul pe străzi) →
  // actualizăm și copia din Salvate, iar pe server după o mică pauză (nu la fiecare mutare).
  useEffect(() => {
    const route = activeRoute;
    if (!route) return;
    const base = routeBaseId(route.id);
    const savedCopy = savedRoutes.find((r) => routeBaseId(r.id) === base);
    if (!savedCopy || savedCopy === route) return;
    setSavedRoutes((cur) => cur.map((r) => (routeBaseId(r.id) === base ? route : r)));
    const serverId = serverIds.current[base];
    if (!online || !serverId) return;
    const timer = setTimeout(() => {
      if (serverIds.current[base] !== serverId) return; // între timp a fost scoasă din Salvate
      // La eroare spunem (altfel modificarea s-ar pierde fără să știi, la următoarea pornire)
      updateSavedRoute(token!, serverId, route).catch((e) =>
        Alert.alert(i18n.t('route.saveFailed'), e instanceof Error ? e.message : ''),
      );
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoute]);

  function replaceRoute(route: Route) {
    setActiveRoute(route);
    setWalk((w) => (w ? { ...w, routeId: route.id } : w));
  }

  function addStop(stop: Stop): 'added' | 'exists' | 'created' {
    if (!activeRoute) {
      // Rută construită de mână din Explore: o începi tu, alegi tu ordinea
      openRoute(
        buildRoute(
          {
            id: `custom-${Date.now()}`,
            title: i18n.t('route.customTitle'),
            duration: '1h',
            pace: i18n.t('route.pace'),
            tags: [],
          },
          [stop],
        ),
      );
      return 'created';
    }
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
        renameRoute,
        savedRoutes,
        savedLoading,
        reloadSaved,
        isRouteSaved: isSaved,
        toggleSavedRoute,
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
        isPlaceSaved: (id) => savedPlaces.some((p) => p.id === id),
        toggleSavedPlace,
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
