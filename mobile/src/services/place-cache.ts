// Locurile văzute în Explore, ca Place story să le găsească după id
// (nu sunt în rută și nici în Salvate). Doar în memorie, cât e deschisă aplicația.
import type { Stop } from '@/types';

const cache = new Map<string, Stop>();

export function rememberPlaces(places: Stop[]) {
  for (const p of places) cache.set(p.id, p);
}

export const cachedPlace = (id: string) => cache.get(id);
