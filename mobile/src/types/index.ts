export type User = {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
};

export type Duration = '1h' | '2h' | '3h+';

export type Interest = 'architecture' | 'history' | 'coffee' | 'parks' | 'art';

export type StartPoint = {
  id: string;
  label: string;
  isGps?: boolean;
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
  minutes: number; // cât stai la oprire
};

export type Route = {
  id: string;
  title: string;
  duration: Duration;
  distanceKm: number;
  pace: string;
  stops: Stop[];
};
