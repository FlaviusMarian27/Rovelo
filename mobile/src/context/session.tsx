// Sesiunea: auth real prin backend-ul Spring Boot (JWT).
//
// signIn / signUp doar verifică la server și întorc user-ul + token-ul; sesiunea pornește
// abia la startSession. Așa ecranul poate rula întâi animația de intrare și schimbă
// user-ul când ecranul e acoperit.
// La pornirea aplicației, dacă există un token salvat, îl verificăm cu GET /api/me.
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { api, ApiError } from '@/services/api';
import { clearToken, getToken, setToken } from '@/services/token-storage';
import type { User } from '@/types';

type Result = { ok: true; user: User; token?: string } | { ok: false; error: string };

type ServerUser = { id: string; name: string; email: string };
type AuthResponse = { token: string; user: ServerUser };

type Session = {
  user: User | null;
  /** false până verificăm token-ul salvat (la pornire). */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  startSession: (user: User, token?: string) => void;
  continueAsGuest: () => void;
  signOut: () => void;
  updateProfile: (name: string, email: string) => Promise<Result>;
  deleteAccount: () => Promise<Result>;
};

const SessionContext = createContext<Session | null>(null);

const toUser = (u: ServerUser): User => ({ ...u, isGuest: false });

const fail = (e: unknown): Result => ({
  ok: false,
  error: e instanceof ApiError ? e.message : 'Something went wrong.',
});

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Restaurăm sesiunea din token-ul salvat.
  useEffect(() => {
    (async () => {
      const saved = await getToken();
      if (saved) {
        try {
          const me = await api<ServerUser>('/api/me', { token: saved });
          setUser(toUser(me));
          setTokenState(saved);
        } catch (e) {
          // token expirat / cont șters → îl uităm; fără rețea → rămâi delogat, dar păstrăm token-ul
          if (e instanceof ApiError && e.status === 401) await clearToken();
        }
      }
      setReady(true);
    })();
  }, []);

  async function signIn(email: string, password: string): Promise<Result> {
    try {
      const res = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });
      return { ok: true, user: toUser(res.user), token: res.token };
    } catch (e) {
      return fail(e);
    }
  }

  async function signUp(name: string, email: string, password: string): Promise<Result> {
    try {
      const res = await api<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), password },
      });
      return { ok: true, user: toUser(res.user), token: res.token };
    } catch (e) {
      return fail(e);
    }
  }

  function startSession(u: User, t?: string) {
    if (t) {
      setTokenState(t);
      setToken(t);
    }
    setUser(u);
  }

  // Guest: doar local, fără cont pe server.
  function continueAsGuest() {
    setUser({ id: 'guest', name: 'Guest', email: '', isGuest: true });
  }

  function signOut() {
    clearToken();
    setTokenState(null);
    setUser(null);
  }

  async function updateProfile(name: string, email: string): Promise<Result> {
    if (!user || user.isGuest || !token) return { ok: false, error: 'Create an account first.' };
    try {
      const me = await api<ServerUser>('/api/me', {
        method: 'PUT',
        token,
        body: { name: name.trim(), email: email.trim() },
      });
      const updated = toUser(me);
      setUser(updated);
      return { ok: true, user: updated };
    } catch (e) {
      return fail(e);
    }
  }

  /** Șterge contul pe server. Delogarea o face ecranul (după animație), cu signOut. */
  async function deleteAccount(): Promise<Result> {
    if (!user || user.isGuest || !token) return { ok: false, error: 'No account to delete.' };
    try {
      await api('/api/me', { method: 'DELETE', token });
      return { ok: true, user };
    } catch (e) {
      return fail(e);
    }
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        ready,
        signIn,
        signUp,
        startSession,
        continueAsGuest,
        signOut,
        updateProfile,
        deleteAccount,
      }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
