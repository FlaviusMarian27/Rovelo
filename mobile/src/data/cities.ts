// Orașele din lista de alegere. Mai târziu lista poate veni din backend (geocoding OSM),
// dar orice oraș detectat din GPS merge oricum, chiar dacă nu e aici.
import type { City, StartPoint } from '@/types';

/** Singurul oraș cu rute până vine generarea din backend (mock-urile sunt de aici). */
export const TEST_CITY_ID = 'timisoara';

export const cities: City[] = [
  {
    id: 'timisoara',
    name: 'Timișoara',
    country: 'RO',
    coord: { latitude: 45.7537, longitude: 21.2257 },
  },
  {
    id: 'bucuresti',
    name: 'București',
    country: 'RO',
    coord: { latitude: 44.4268, longitude: 26.1025 },
  },
  {
    id: 'cluj-napoca',
    name: 'Cluj-Napoca',
    country: 'RO',
    coord: { latitude: 46.7712, longitude: 23.6236 },
  },
  { id: 'iasi', name: 'Iași', country: 'RO', coord: { latitude: 47.1585, longitude: 27.6014 } },
  { id: 'brasov', name: 'Brașov', country: 'RO', coord: { latitude: 45.6427, longitude: 25.5887 } },
  { id: 'sibiu', name: 'Sibiu', country: 'RO', coord: { latitude: 45.7983, longitude: 24.1256 } },
  { id: 'oradea', name: 'Oradea', country: 'RO', coord: { latitude: 47.0465, longitude: 21.9189 } },
  { id: 'arad', name: 'Arad', country: 'RO', coord: { latitude: 46.1866, longitude: 21.3123 } },
  {
    id: 'constanta',
    name: 'Constanța',
    country: 'RO',
    coord: { latitude: 44.1598, longitude: 28.6348 },
  },
  {
    id: 'craiova',
    name: 'Craiova',
    country: 'RO',
    coord: { latitude: 44.3302, longitude: 23.7949 },
  },
  {
    id: 'budapest',
    name: 'Budapest',
    country: 'HU',
    coord: { latitude: 47.4979, longitude: 19.0402 },
  },
  { id: 'vienna', name: 'Vienna', country: 'AT', coord: { latitude: 48.2082, longitude: 16.3738 } },
  {
    id: 'belgrade',
    name: 'Belgrade',
    country: 'RS',
    coord: { latitude: 44.7866, longitude: 20.4489 },
  },
  { id: 'prague', name: 'Prague', country: 'CZ', coord: { latitude: 50.0755, longitude: 14.4378 } },
];

export const defaultCity = cities[0];

/** "Iași" → "iasi": pentru căutare fără diacritice și pentru potrivirea cu numele din GPS. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function findCityByName(name: string) {
  const n = normalize(name);
  return cities.find((c) => normalize(c.name) === n || c.id === n);
}

// Puncte de start: GPS mereu; pentru Timișoara și câteva piețe, altfel centrul orașului.
const timisoaraStarts: StartPoint[] = [
  { id: 'victoriei', label: 'Piața Victoriei', coord: { latitude: 45.7537, longitude: 21.2257 } },
  { id: 'unirii', label: 'Piața Unirii', coord: { latitude: 45.7578, longitude: 21.2291 } },
  { id: 'gara', label: 'Gara de Nord', coord: { latitude: 45.7509, longitude: 21.2079 } },
];

export function startPointsFor(city: City): StartPoint[] {
  const gps: StartPoint = { id: 'gps', label: 'My location (GPS)', isGps: true };
  if (city.id === TEST_CITY_ID) return [gps, ...timisoaraStarts];
  return [gps, { id: `center:${city.id}`, label: `${city.name} city centre`, coord: city.coord }];
}
