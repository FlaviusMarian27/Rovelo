// Clientul HTTP spre backend-ul Spring Boot.
// URL-ul vine din mobile/.env: EXPO_PUBLIC_API_URL=http://<IP-laptop>:8080
// (telefonul și laptopul în aceeași rețea; IP-ul îl afli cu `hostname -I`).

import i18n from '@/i18n';

// Mesajele cunoscute de la server → cheia de traducere (serverul răspunde în engleză).
const SERVER_MESSAGES: Record<string, string> = {
  'Wrong email or password.': 'errors.wrongCredentials',
  'An account with this email already exists.': 'errors.emailTaken',
  'This nickname is already taken.': 'errors.nicknameTaken',
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number, // 0 = nu s-a ajuns la server
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function api<T>(path: string, { method = 'GET', body, token }: Options = {}) {
  if (!BASE_URL) {
    throw new ApiError(i18n.t('errors.apiUrlMissing'), 0);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(i18n.t('errors.network'), 0);
  } finally {
    clearTimeout(timer);
  }

  // 204 No Content (ex. DELETE) sau răspuns gol
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const serverMessage = data && typeof data.error === 'string' ? data.error : null;
    const message = serverMessage
      ? SERVER_MESSAGES[serverMessage]
        ? i18n.t(SERVER_MESSAGES[serverMessage])
        : serverMessage
      : i18n.t(res.status === 401 ? 'errors.sessionExpired' : 'errors.generic');
    throw new ApiError(message, res.status, data?.fields);
  }
  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
