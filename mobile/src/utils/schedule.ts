// Planul în timp al unei rute și cât de în urmă ești față de el.
import type { WalkState } from '@/context/route';
import type { Route } from '@/types';

// Minutul (din plan) la care ar trebui să ajungi la fiecare oprire.
// Ceasul pornește la sosirea la prima oprire → arrivals[0] = 0.
export function plannedArrivals(route: Route) {
  const arr = [0];
  for (let i = 1; i < route.stops.length; i++) {
    arr.push(arr[i - 1] + route.stops[i - 1].visitMinutes + route.legs[i - 1].walkMinutes);
  }
  return arr;
}

/**
 * Câte minute ești în urmă (negativ = în avans). null cât timp nu se poate calcula.
 * Se calculează doar cât mergi spre o oprire: cât stai la oprire, cardul de sosire are prioritate.
 * În demo timpul e accelerat, deci întârzierea e doar cea simulată (delayMin).
 */
export function lateMinutes(
  route: Route,
  walk: WalkState,
  now: number,
  minutesToTarget: number | null,
): number | null {
  if (walk.phase !== 'walking' || !walk.startedAt || minutesToTarget === null) return null;
  if (walk.demo) return walk.delayMin;
  const elapsed = (now - walk.startedAt) / 60_000;
  const projectedArrival = elapsed + minutesToTarget;
  return Math.round(projectedArrival - plannedArrivals(route)[walk.index]);
}

export const LATE_THRESHOLD_MIN = 5;

// Arătăm bannerul dacă ești destul de în urmă și n-ai zis "Not now" la o valoare apropiată.
export function shouldShowLate(late: number | null, snoozedLate: number | null) {
  if (late === null || late < LATE_THRESHOLD_MIN) return false;
  return snoozedLate === null || late >= snoozedLate + 10;
}

// "~10 min" — rotunjit la 5, ca în Figma.
export const roughMinutes = (m: number) => `~${Math.max(5, Math.round(m / 5) * 5)} min`;
