// Locurile salvate pe server (backend: /api/places). Cheia = id-ul locului din aplicație.
import { api } from '@/services/api';
import type { PlaceStory, Stop } from '@/types';

/** Ce salvăm despre un loc: datele lui + povestea, ca Saved să le poată arăta oricând. */
export type PlaceSnapshot = Stop & { story?: PlaceStory };

export type SavedPlaceEntry = { key: string; savedAt: string; place: PlaceSnapshot };

/** Cheia din URL: id-urile OSM au "/" ("osm:way/123"), pe care serverul nu-l acceptă în cale. */
const placeKey = (id: string) => encodeURIComponent(id.replace(/\//g, '_'));

export const listSavedPlaces = (token: string) => api<SavedPlaceEntry[]>('/api/places', { token });

export const savePlace = (token: string, place: PlaceSnapshot) =>
  api<SavedPlaceEntry>(`/api/places/${placeKey(place.id)}`, {
    method: 'PUT',
    token,
    body: place,
  });

export const deleteSavedPlace = (token: string, id: string) =>
  api<void>(`/api/places/${placeKey(id)}`, { method: 'DELETE', token });
