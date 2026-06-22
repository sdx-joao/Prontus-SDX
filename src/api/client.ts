const DEFAULT_API_URL = 'http://10.32.20.220:3000';
const REQUEST_TIMEOUT_MS = 15000;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_SDX_API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;

export const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';
/** Build de teste (ambiente de teste) — habilita recursos só de teste, ex.: auto-cadastro. */
export const IS_TEST_BUILD = APP_ENV === 'test';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Tempo limite ao conectar com o servidor Scandex.', 408, 'timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && (payload.message || payload.error)) || `Erro ${res.status}`;
    throw new ApiError(message, res.status, payload?.code);
  }

  return payload as T;
}
