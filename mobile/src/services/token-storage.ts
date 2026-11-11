// Token-ul JWT se ține criptat pe telefon (Keychain pe iOS, Keystore pe Android),
// ca să rămâi logat după ce închizi aplicația.
import * as SecureStore from 'expo-secure-store';

const KEY = 'rovelo.token';

// SecureStore nu există pe web; acolo ținem token-ul doar în memorie.
let memory: string | null = null;

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return memory;
  }
}

export async function setToken(token: string) {
  memory = token;
  try {
    await SecureStore.setItemAsync(KEY, token);
  } catch {
    // web: rămâne în memorie
  }
}

export async function clearToken() {
  memory = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // web
  }
}
