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
  meta: Pick<Route, 'id' | 'title' | 'duration' | 'pace'>,
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
    path: stops.map((s) => s.coord), // linie dreaptă între opriri; backend-ul va da drumul pe străzi
    totalMinutes: walk + visit,
    distanceKm: Math.round(meters / 100) / 10,
  };
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
