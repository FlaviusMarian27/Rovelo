// Auth simulat, în memorie. Când apare backend-ul Spring Boot,
// se schimbă doar funcțiile de aici (signIn / signUp / signOut) cu apeluri API.
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { mockAccounts } from '@/data/mock';
import type { User } from '@/types';

type Result = { ok: true } | { ok: false; error: string };

type Session = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  continueAsGuest: () => void;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

// Conturile create în sesiunea curentă (se pierd la restart, e ok pentru acum).
const accounts = [...mockAccounts];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  async function signIn(email: string, password: string): Promise<Result> {
    await delay(400);
    const acc = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!acc || acc.password !== password) {
      return { ok: false, error: 'Wrong email or password.' };
    }
    setUser({ id: acc.id, name: acc.name, email: acc.email, isGuest: false });
    return { ok: true };
  }

  async function signUp(name: string, email: string, password: string): Promise<Result> {
    await delay(400);
    const clean = email.trim().toLowerCase();
    if (accounts.some((a) => a.email.toLowerCase() === clean)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const acc = { id: `u${accounts.length + 1}`, name: name.trim(), email: clean, password };
    accounts.push(acc);
    setUser({ id: acc.id, name: acc.name, email: acc.email, isGuest: false });
    return { ok: true };
  }

  function continueAsGuest() {
    setUser({ id: 'guest', name: 'Guest', email: '', isGuest: true });
  }

  function signOut() {
    setUser(null);
  }

  return (
    <SessionContext.Provider value={{ user, signIn, signUp, continueAsGuest, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
