export const MIN_PASSWORD = 8;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** La fel ca pe server: 3–30 caractere, litere, cifre, punct și underscore. Gol = fără nickname. */
export function isValidNickname(nickname: string) {
  const n = nickname.trim();
  return n === '' || /^[A-Za-z0-9._]{3,30}$/.test(n);
}

export const BIO_MAX = 160;
