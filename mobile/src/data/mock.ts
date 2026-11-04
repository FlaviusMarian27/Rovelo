// Date false până există backend-ul și agentul AI.
import type { Duration, Interest, Route, StartPoint } from '@/types';

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
  { id: 'victoriei', label: 'Piața Victoriei' },
  { id: 'unirii', label: 'Piața Unirii' },
  { id: 'gara', label: 'Gara de Nord' },
];

export const currentCity = 'Timișoara';

// Ce "returnează agentul" deocamdată.
export const mockRoute: Route = {
  id: 'r1',
  title: 'The heart of Timișoara',
  duration: '2h',
  distanceKm: 2.4,
  pace: 'Easy pace',
  stops: [
    { id: 's1', name: 'Piața Victoriei', blurb: 'Grand façades & city stories', minutes: 15 },
    { id: 's2', name: 'Catedrala Mitropolitană', blurb: 'An icon of Timișoara', minutes: 20 },
    { id: 's3', name: 'Local café', blurb: 'A slow coffee, a little people-watching', minutes: 30 },
    { id: 's4', name: 'Parcul Rozelor', blurb: 'A quiet moment by the Bega', minutes: 25 },
  ],
};
