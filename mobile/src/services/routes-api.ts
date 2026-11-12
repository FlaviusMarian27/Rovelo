// Rutele salvate pe server (backend: /api/routes). Ruta se trimite și se primește întreagă, ca JSON.
import { api } from '@/services/api';
import type { Route } from '@/types';

export type SavedRouteEntry = { id: string; savedAt: string; route: Route };

export const listSavedRoutes = (token: string) => api<SavedRouteEntry[]>('/api/routes', { token });

export const saveRoute = (token: string, route: Route) =>
  api<SavedRouteEntry>('/api/routes', { method: 'POST', token, body: route });

export const deleteSavedRoute = (token: string, id: string) =>
  api<void>(`/api/routes/${id}`, { method: 'DELETE', token });
