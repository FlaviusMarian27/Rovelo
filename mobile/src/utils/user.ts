import type { User } from '@/types';

export const fullName = (u: Pick<User, 'firstName' | 'lastName'>) =>
  [u.firstName, u.lastName].filter(Boolean).join(' ');

/** Inițialele pentru avatar (max 2 litere). */
export const initials = (u: Pick<User, 'firstName' | 'lastName'>) =>
  fullName(u)
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
