// Drumul real pe jos, pe străzi (backend → OSRM). Dacă nu merge, ruta păstrează estimarea locală.
import { api } from '@/services/api';
import type { Coord, Leg } from '@/types';

export type WalkResponse = {
  legs: Leg[]; // între opriri consecutive
  path: Coord[]; // linia pe străzi
  waypoints: Coord[]; // unde ajunge drumul lângă fiecare oprire
};

export const fetchWalk = (points: Coord[], token?: string | null) =>
  api<WalkResponse>('/api/routes/walk', {
    method: 'POST',
    body: { points },
    token,
    timeoutMs: 20_000,
  });
