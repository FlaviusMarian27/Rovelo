// Leagă poziția de progresul din context: detectează sosirea / plecarea de la opriri
// și calculează cât de în urmă ești față de plan.
// Ordinea opririlor e fixă (ordinea din route.stops).
import { useEffect, useState } from 'react';

import { useRoute, type WalkState } from '@/context/route';
import type { Coord, Route } from '@/types';
import { distanceMeters, estimateLeg } from '@/utils/geo';
import { lateMinutes } from '@/utils/schedule';

const ARRIVE_M = 30; // sub atât = ai ajuns la oprire
const LEAVE_M = 60; // peste atât după sosire = ai plecat → următoarea oprire

export function useWalkProgress(route: Route, walk: WalkState, position: Coord | null) {
  const { arrive, nextStop } = useRoute();
  const now = useNow(walk.demo ? 1000 : 15_000);

  const index = Math.min(walk.index, route.stops.length - 1);
  const target = route.stops[index];

  useEffect(() => {
    if (!position || walk.phase === 'finished') return;
    const d = distanceMeters(position, target.coord);
    if (walk.phase === 'walking' && d <= ARRIVE_M) arrive();
    // a plecat de la oprire fără să apese Continue → trecem automat mai departe
    if (walk.phase === 'arrived' && d > LEAVE_M) nextStop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, walk.phase, index]);

  const toTarget = position ? estimateLeg(position, target.coord) : null;

  return {
    index,
    phase: walk.phase,
    target,
    isLast: index === route.stops.length - 1,
    toTarget, // { meters, walkMinutes } până la oprirea curentă
    late: lateMinutes(route, walk, now, toTarget?.walkMinutes ?? null),
    next: nextStop,
  };
}

// Un ceas care bate la `ms`, ca întârzierea să se recalculeze și când stai pe loc.
function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
