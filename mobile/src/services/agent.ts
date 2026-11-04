// "Agentul AI" — deocamdată mock-uri locale cu aceeași formă ca viitoarele apeluri spre backend:
//   POST /routes/replan   → replanRoute
//   POST /landmarks/recognize → recognizeLandmark
// Când există backend-ul, se înlocuiesc doar funcțiile de aici.
import { places } from '@/data/mock';
import type { Route, Stop } from '@/types';
import { buildRoute, estimateLeg } from '@/utils/geo';

const thinking = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

export type ReplanResult = { route: Route; removed: Stop[]; savedMin: number };

/**
 * Scurtează ruta ca să recuperezi `lateMin` minute. Păstrează opririle deja vizitate,
 * oprirea curentă și ordinea celor rămase; scoate pe rând oprirea care economisește cel mai mult.
 * Întoarce null dacă nu are ce scoate.
 */
export async function replanRoute(
  route: Route,
  currentIndex: number,
  lateMin: number,
): Promise<ReplanResult | null> {
  await thinking();

  const stops = [...route.stops];
  const removed: Stop[] = [];
  let saved = 0;

  // timpul economisit dacă scoatem oprirea k (vizita + ocolul prin ea)
  const saving = (k: number) => {
    const prev = stops[k - 1];
    const next = stops[k + 1];
    const via =
      (prev ? estimateLeg(prev.coord, stops[k].coord).walkMinutes : 0) +
      (next ? estimateLeg(stops[k].coord, next.coord).walkMinutes : 0);
    const direct = prev && next ? estimateLeg(prev.coord, next.coord).walkMinutes : 0;
    return stops[k].visitMinutes + via - direct;
  };

  while (saved < lateMin && stops.length - 1 > currentIndex) {
    let best = currentIndex + 1;
    for (let k = currentIndex + 1; k < stops.length; k++) {
      if (saving(k) > saving(best)) best = k;
    }
    saved += saving(best);
    removed.push(...stops.splice(best, 1));
  }

  if (!removed.length) return null;
  const { title, duration, pace } = route;
  return {
    route: buildRoute({ id: `${route.id}~${removed.length}`, title, duration, pace }, stops),
    removed,
    savedMin: saved,
  };
}

/** Recunoaște clădirea din poză. Mock: întoarce Catedrala (ca în Figma). */
export async function recognizeLandmark(_photoUri: string): Promise<Stop> {
  await thinking(1500);
  return places.catedrala;
}
