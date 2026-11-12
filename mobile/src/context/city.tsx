// Orașul în care îți planifici plimbarea.
// - Automat: dacă ai dat deja voie la locație, aflăm orașul din GPS (fără să cerem nimic la pornire).
// - Manual: din lista cu căutare (CityPicker), unde poți cere și "Use my current location".
import * as Location from 'expo-location';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { defaultCity, findCityByName, normalize } from '@/data/cities';
import type { City } from '@/types';

export type DetectResult = 'ok' | 'denied' | 'failed';

type CityState = {
  city: City;
  /** true dacă orașul vine din GPS (nu ales manual). */
  fromGps: boolean;
  detecting: boolean;
  setCity: (city: City) => void;
  /** Află orașul din GPS. `ask` = cere permisiunea dacă nu e dată (doar la acțiunea utilizatorului). */
  detectCity: (ask?: boolean) => Promise<DetectResult>;
};

const CityContext = createContext<CityState | null>(null);

export function CityProvider({ children }: PropsWithChildren) {
  const [city, setCityState] = useState<City>(defaultCity);
  const [fromGps, setFromGps] = useState(false);
  const [detecting, setDetecting] = useState(false);

  async function detectCity(ask = false): Promise<DetectResult> {
    setDetecting(true);
    try {
      const perm = ask
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (!perm.granted) return 'denied';

      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      const [address] = await Location.reverseGeocodeAsync(coord);
      const name = address?.city ?? address?.subregion ?? address?.region;
      if (!name) return 'failed';

      // Dacă e în listă, folosim intrarea de acolo (are puncte de start); altfel un oraș nou.
      setCityState(
        findCityByName(name) ?? {
          id: `gps:${normalize(name)}`,
          name,
          country: address?.isoCountryCode ?? undefined,
          coord,
        },
      );
      setFromGps(true);
      return 'ok';
    } catch {
      return 'failed';
    } finally {
      setDetecting(false);
    }
  }

  // La pornire: doar dacă permisiunea e deja dată, ca să nu apară un popup din senin.
  useEffect(() => {
    detectCity(false);
  }, []);

  return (
    <CityContext.Provider
      value={{
        city,
        fromGps,
        detecting,
        setCity: (c) => {
          setCityState(c);
          setFromGps(false);
        },
        detectCity,
      }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used inside CityProvider');
  return ctx;
}
