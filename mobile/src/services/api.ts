// Clientul HTTP spre backend-ul Spring Boot.
// URL-ul vine din mobile/.env: EXPO_PUBLIC_API_URL=http://<IP-laptop>:8080
// (telefonul și laptopul în aceeași rețea; IP-ul îl afli cu `hostname -I`).

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
    throw new ApiError('EXPO_PUBLIC_API_URL is not set in mobile/.env.', 0);
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
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  } finally {
    clearTimeout(timer);
  }

  // 204 No Content (ex. DELETE) sau răspuns gol
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      (res.status === 401
        ? 'Your session has expired. Please log in again.'
        : 'Something went wrong.');
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
