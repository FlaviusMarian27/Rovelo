// Generarea de rute din backend: locuri reale din OpenStreetMap, alese după timp și interese.
// Backend-ul dă opririle în ordine; mersul dintre ele îl calculează aplicația (buildRoute).
import i18n from '@/i18n';
import { api } from '@/services/api';
import type { Coord, Duration, Interest, Stop } from '@/types';

export type PlannedStop = {
  id: string; // "osm:way/123"
  name: string;
  kind: string; // "cafe", "museum"… → traducere în kinds.*
  coord: Coord;
  visitMinutes: number;
};

export type PlanResponse = { stops: PlannedStop[]; totalMinutes: number };

export const planRoute = (
  body: { start: Coord; duration: Duration; interests: Interest[] },
  token?: string | null,
) =>
  api<PlanResponse>('/api/routes/generate', {
    method: 'POST',
    body,
    token,
    timeoutMs: 60_000, // dacă zona nu e importată, serverul întreabă Overpass, care poate fi lent
  });

/** Locul de la backend → oprire în aplicație (tipul tradus devine descrierea scurtă). */
export const toStop = (s: PlannedStop): Stop => ({
  id: s.id,
  name: s.name,
  kind: s.kind,
  blurb: i18n.t(`kinds.${s.kind}`, { defaultValue: '' }),
  coord: s.coord,
  visitMinutes: s.visitMinutes,
});
