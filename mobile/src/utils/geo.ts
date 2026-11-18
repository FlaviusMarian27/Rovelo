import type { Coord, Leg, Route, Stop } from '@/types';

const EARTH_RADIUS_M = 6_371_000;
const WALK_M_PER_MIN = 75; // ~4.5 km/h, ritm relaxat
const STREET_FACTOR = 1.3; // pe străzi e mai lung decât în linie dreaptă

// Distanța în linie dreaptă între două puncte (formula haversine), în metri.
export function distanceMeters(a: Coord, b: Coord) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Estimare locală până avem motorul de rutare din backend (OpenRouteService etc.).
export function estimateLeg(a: Coord, b: Coord): Leg {
  const meters = Math.round(distanceMeters(a, b) * STREET_FACTOR);
  return { meters, walkMinutes: Math.max(1, Math.round(meters / WALK_M_PER_MIN)) };
}

// Construiește o rută completă din opriri, păstrând ordinea dată.
export function buildRoute(
  meta: Pick<Route, 'id' | 'title' | 'duration' | 'pace' | 'tags'>,
  stops: Stop[],
): Route {
  const legs = stops.slice(1).map((s, i) => estimateLeg(stops[i].coord, s.coord));
  const walk = legs.reduce((t, l) => t + l.walkMinutes, 0);
  const visit = stops.reduce((t, s) => t + s.visitMinutes, 0);
  const meters = legs.reduce((t, l) => t + l.meters, 0);
  return {
    ...meta,
    stops,
    legs,
    path: stops.map((s) => s.coord), // linie dreaptă; drumul pe străzi vine apoi (withStreets)
    totalMinutes: walk + visit,
    distanceKm: Math.round(meters / 100) / 10,
  };
}

// Aceeași rută, cu drumul real pe străzi (de la backend). Totalurile se recalculează.
export function withStreets(
  route: Route,
  walk: { legs: Leg[]; path: Coord[]; waypoints: Coord[] },
): Route {
  if (walk.legs.length !== route.stops.length - 1 || walk.path.length < 2) return route;
  const walkMin = walk.legs.reduce((t, l) => t + l.walkMinutes, 0);
  const visit = route.stops.reduce((t, s) => t + s.visitMinutes, 0);
  const meters = walk.legs.reduce((t, l) => t + l.meters, 0);
  return {
    ...route,
    legs: walk.legs,
    path: walk.path,
    waypoints: walk.waypoints.length === route.stops.length ? walk.waypoints : undefined,
    streets: true,
    totalMinutes: walkMin + visit,
    distanceKm: Math.round(meters / 100) / 10,
  };
}

// Pentru fiecare oprire, indexul punctului din `path` unde ajungi la ea.
// Fără drum pe străzi, path = opririle, deci indexul e chiar i.
export function stopPathIndices(route: Route): number[] {
  if (!route.streets) return route.stops.map((_, i) => i);
  const targets = route.waypoints ?? route.stops.map((s) => s.coord);
  let from = 0;
  return targets.map((target, k) => {
    if (k === 0) return 0;
    let best = from;
    let bestD = Infinity;
    for (let i = from; i < route.path.length; i++) {
      const d = distanceMeters(route.path[i], target);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    from = best;
    return best;
  });
}

// Direcția de la a spre b, în grade (0 = nord, 90 = est).
export function bearing(a: Coord, b: Coord) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLng = rad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(rad(b.latitude));
  const x =
    Math.cos(rad(a.latitude)) * Math.sin(rad(b.latitude)) -
    Math.sin(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Punctul aflat la fracția t (0..1) pe segmentul a → b.
export function lerp(a: Coord, b: Coord, t: number): Coord {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
