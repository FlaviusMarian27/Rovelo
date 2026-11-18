// Locurile din jur pentru Explore (backend: GET /api/explore, din tabela places).
import { api } from '@/services/api';
import { toStop, type PlannedStop } from '@/services/planner-api';
import type { Coord, Stop } from '@/types';

export async function exploreNearby(
  center: Coord,
  radius: number,
  kinds: string[],
): Promise<Stop[]> {
  const params = new URLSearchParams({
    lat: center.latitude.toFixed(5),
    lon: center.longitude.toFixed(5),
    radius: String(Math.round(radius)),
  });
  if (kinds.length) params.set('kinds', kinds.join(','));
  const res = await api<PlannedStop[]>(`/api/explore?${params}`);
  return res.map(toStop);
}

export async function searchPlaces(center: Coord, query: string): Promise<Stop[]> {
  const params = new URLSearchParams({
    lat: center.latitude.toFixed(5),
    lon: center.longitude.toFixed(5),
    q: query.trim(),
  });
  const res = await api<PlannedStop[]>(`/api/explore?${params}`);
  return res.map(toStop);
}
