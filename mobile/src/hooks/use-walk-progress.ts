// Unde ești pe traseu: spre ce oprire mergi, dacă ai ajuns, dacă ai terminat.
// Ordinea opririlor e fixă (ordinea din route.stops).
import { useEffect, useState } from 'react';

import type { Coord, Route } from '@/types';
import { distanceMeters, estimateLeg } from '@/utils/geo';

const ARRIVE_M = 30; // sub atât = ai ajuns la oprire
const LEAVE_M = 60; // peste atât după sosire = ai plecat → următoarea oprire

export type WalkPhase = 'walking' | 'arrived' | 'finished';

export function useWalkProgress(route: Route, position: Coord | null) {
  const [index, setIndex] = useState(0); // oprirea spre care mergi / la care ești
  const [phase, setPhase] = useState<WalkPhase>('walking');

  const last = route.stops.length - 1;
  const target = route.stops[index];

  const next = () => {
    if (index >= last) setPhase('finished');
    else {
      setIndex(index + 1);
      setPhase('walking');
    }
  };

  useEffect(() => {
    if (!position || phase === 'finished') return;
    const d = distanceMeters(position, target.coord);
    if (phase === 'walking' && d <= ARRIVE_M) setPhase('arrived');
    // a plecat de la oprire fără să apese Continue → trecem automat mai departe
    if (phase === 'arrived' && d > LEAVE_M) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, phase, index]);

  const toTarget = position ? estimateLeg(position, target.coord) : null;

  return {
    index,
    phase,
    target,
    isLast: index === last,
    toTarget, // { meters, walkMinutes } până la oprirea curentă
    next,
  };
}
