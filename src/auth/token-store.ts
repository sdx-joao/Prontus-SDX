import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'sdx.auth.token';
const REGISTERED_KEY = 'sdx.auth.registered'; // trava do auto-cadastro de teste (1 por aparelho)
const REGISTERED_USER_KEY = 'sdx.auth.registered_username';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** Marca que este aparelho já criou um usuário de teste (não pode criar outro). */
export async function markDeviceRegistered(username: string): Promise<void> {
  await SecureStore.setItemAsync(REGISTERED_KEY, '1');
  await SecureStore.setItemAsync(REGISTERED_USER_KEY, username);
}

/** Retorna o usuário cadastrado neste aparelho (ou null se nunca cadastrou). */
export async function getRegisteredUsername(): Promise<string | null> {
  const flag = await SecureStore.getItemAsync(REGISTERED_KEY);
  if (flag !== '1') return null;
  return (await SecureStore.getItemAsync(REGISTERED_USER_KEY)) ?? '';
}
