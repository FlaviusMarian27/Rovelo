export type User = {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
};

export type Duration = '1h' | '2h' | '3h+';

export type Interest = 'architecture' | 'history' | 'coffee' | 'parks' | 'art';

export type Coord = { latitude: number; longitude: number };

export type StartPoint = {
  id: string;
  label: string;
  isGps?: boolean;
  coord?: Coord; // lipsește pentru GPS (se ia la generare)
};

export type WalkPreferences = {
  duration: Duration;
  interests: Interest[];
  start: StartPoint;
};

export type Stop = {
  id: string;
  name: string;
  blurb: string;
  coord: Coord;
  visitMinutes: number; // cât stai la oprire
};

// Drumul dintre două opriri consecutive (stops[i] → stops[i + 1]).
export type Leg = {
  walkMinutes: number;
  meters: number;
};

// Forma pe care o va întoarce și backend-ul.
// Ordinea din `stops` ESTE ordinea de parcurgere (o alege cine creează ruta).
export type Route = {
  id: string;
  title: string;
  duration: Duration;
  pace: string;
  stops: Stop[];
  legs: Leg[]; // stops.length - 1 elemente
  path: Coord[]; // linia de desenat pe hartă
  totalMinutes: number; // opriri + mers
  distanceKm: number;
};

// Povestea unui loc (Place story).
export type PlaceStory = {
  category: string;
  area: string;
  story: string;
  tip: string;
};
