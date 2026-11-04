// Traseul activ. Acum generateRoute întoarce un mock; mai târziu aici vine apelul
// spre backend (care vorbește cu agentul AI).
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { mockRouteFor } from '@/data/mock';
import type { Route, WalkPreferences } from '@/types';

type RouteState = {
  activeRoute: Route | null;
  generating: boolean;
  generateRoute: (prefs: WalkPreferences) => Promise<Route>;
  clearRoute: () => void;
};

const RouteContext = createContext<RouteState | null>(null);

export function RouteProvider({ children }: PropsWithChildren) {
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generateRoute(prefs: WalkPreferences) {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulează "agentul gândește"
    const route = mockRouteFor(prefs.duration);
    setActiveRoute(route);
    setGenerating(false);
    return route;
  }

  return (
    <RouteContext.Provider
      value={{ activeRoute, generating, generateRoute, clearRoute: () => setActiveRoute(null) }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRoute must be used inside RouteProvider');
  return ctx;
}
