// Date false până există backend-ul și agentul AI.
// Coordonatele sunt reale (aproximativ) în Timișoara.
import type { Duration, Interest, Route, StartPoint, Stop } from '@/types';
import { buildRoute } from '@/utils/geo';

// Cont demo ca să poți intra direct cu Log in.
export const mockAccounts = [
  { id: 'u1', name: 'Flavius', email: 'demo@rovelo.app', password: 'rovelo123' },
];

export const durations: Duration[] = ['1h', '2h', '3h+'];

export const interests: { id: Interest; label: string }[] = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'history', label: 'History' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'parks', label: 'Parks' },
  { id: 'art', label: 'Art' },
];

export const startPoints: StartPoint[] = [
  { id: 'gps', label: 'My location (GPS)', isGps: true },
  { id: 'victoriei', label: 'Piața Victoriei', coord: { latitude: 45.7537, longitude: 21.2257 } },
  { id: 'unirii', label: 'Piața Unirii', coord: { latitude: 45.7578, longitude: 21.2291 } },
  { id: 'gara', label: 'Gara de Nord', coord: { latitude: 45.7509, longitude: 21.2079 } },
];

export const currentCity = 'Timișoara';

// Locuri (ce va întoarce search_places din OpenStreetMap).
const places = {
  opera: {
    id: 'opera',
    name: 'Opera Națională',
    blurb: 'Where the 1989 revolution found its voice',
    coord: { latitude: 45.7559, longitude: 21.2262 },
    visitMinutes: 10,
  },
  victoriei: {
    id: 'victoriei',
    name: 'Piața Victoriei',
    blurb: 'Grand façades & city stories',
    coord: { latitude: 45.7537, longitude: 21.2257 },
    visitMinutes: 15,
  },
  catedrala: {
    id: 'catedrala',
    name: 'Catedrala Mitropolitană',
    blurb: 'An icon of Timișoara',
    coord: { latitude: 45.7505, longitude: 21.2242 },
    visitMinutes: 20,
  },
  libertatii: {
    id: 'libertatii',
    name: 'Piața Libertății',
    blurb: 'The quiet square between the two big ones',
    coord: { latitude: 45.7557, longitude: 21.2287 },
    visitMinutes: 10,
  },
  unirii: {
    id: 'unirii',
    name: 'Piața Unirii',
    blurb: 'Baroque colours and the old Dom',
    coord: { latitude: 45.7579, longitude: 21.2293 },
    visitMinutes: 20,
  },
  bastion: {
    id: 'bastion',
    name: 'Bastionul Theresia',
    blurb: 'What is left of the old citadel walls',
    coord: { latitude: 45.7575, longitude: 21.2336 },
    visitMinutes: 15,
  },
  cafe: {
    id: 'cafe',
    name: 'Local café',
    blurb: 'A slow coffee, a little people-watching',
    coord: { latitude: 45.7548, longitude: 21.2305 },
    visitMinutes: 30,
  },
  rozelor: {
    id: 'rozelor',
    name: 'Parcul Rozelor',
    blurb: 'A quiet moment by the Bega',
    coord: { latitude: 45.7489, longitude: 21.2313 },
    visitMinutes: 25,
  },
} satisfies Record<string, Stop>;

// Câte o rută pe durată, cu număr diferit de opriri (ordinea = ordinea de parcurgere).
const routesByDuration: Record<Duration, Route> = {
  '1h': buildRoute(
    { id: 'r-1h', title: 'Old town in an hour', duration: '1h', pace: 'Easy pace' },
    [places.victoriei, places.libertatii, places.unirii],
  ),
  '2h': buildRoute(
    { id: 'r-2h', title: 'The heart of Timișoara', duration: '2h', pace: 'Easy pace' },
    [places.victoriei, places.catedrala, places.cafe, places.rozelor],
  ),
  '3h+': buildRoute(
    { id: 'r-3h', title: 'Squares, walls & the Bega', duration: '3h+', pace: 'Relaxed pace' },
    [
      places.opera,
      places.libertatii,
      places.unirii,
      places.bastion,
      places.cafe,
      places.rozelor,
      places.catedrala,
    ],
  ),
};

// Ce "returnează agentul" deocamdată.
export function mockRouteFor(duration: Duration): Route {
  return routesByDuration[duration];
}
