// Poziția utilizatorului: GPS real (expo-location) sau simulată (mod demo).
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import type { Coord, Route } from '@/types';
import { distanceMeters, lerp } from '@/utils/geo';

export type GpsStatus = 'idle' | 'asking' | 'denied' | 'ok' | 'error';

// GPS real. Cere permisiunea doar când `enabled` e true.
export function useGpsPosition(enabled: boolean) {
  const [status, setStatus] = useState<GpsStatus>('idle');
  const [position, setPosition] = useState<Coord | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      setStatus('asking');
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (!granted) return setStatus('denied');
      try {
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 2000 },
          ({ coords }) => {
            setPosition({ latitude: coords.latitude, longitude: coords.longitude });
            setStatus('ok');
          },
        );
        if (cancelled) sub.remove();
      } catch {
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return { status, position };
}

const TICK_MS = 200;
const DEMO_SPEED_M_PER_TICK = 10; // ~50 m/s: un traseu de 2 km în ~40 s
const DEMO_PAUSE_MS = 4000; // cât "stai" la fiecare oprire

// Mod demo: un punct care merge pe `route.path` și se oprește puțin la fiecare oprire.
export function useSimulatedPosition(route: Route, enabled: boolean) {
  const [position, setPosition] = useState<Coord | null>(null);
  const state = useRef({ seg: 0, meters: 0, pauseUntil: 0 });

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      return;
    }
    const path = route.path;
    state.current = { seg: 0, meters: 0, pauseUntil: Date.now() + 1500 };
    setPosition(path[0]);

    const id = setInterval(() => {
      const s = state.current;
      if (Date.now() < s.pauseUntil || s.seg >= path.length - 1) return;

      const a = path[s.seg];
      const b = path[s.seg + 1];
      const len = distanceMeters(a, b) || 1;
      s.meters += DEMO_SPEED_M_PER_TICK;

      if (s.meters >= len) {
        s.seg += 1;
        s.meters = 0;
        // path = punctele opririlor deocamdată → fiecare vârf e o oprire
        s.pauseUntil = Date.now() + DEMO_PAUSE_MS;
        setPosition(b);
      } else {
        setPosition(lerp(a, b, s.meters / len));
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [route, enabled]);

  return position;
}
