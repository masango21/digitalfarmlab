import {
  getAccessToken,
  getRefreshToken,
  invalidateStoredSession,
  storeSession,
} from '@/lib/auth-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

interface TokenResponse<TUser> {
  accessToken: string;
  refreshToken: string;
  user: TUser;
}

let refreshRequest: Promise<boolean> | undefined;

async function decodeResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError('The server returned an invalid response', response.status);
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      && typeof payload.error === 'string'
      ? payload.error
      : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

async function refreshTokens() {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    try {
      const tokens = await apiRequest<TokenResponse<unknown>>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        auth: false,
        retryAuth: false,
      });
      await storeSession(tokens.accessToken, tokens.refreshToken, JSON.stringify(tokens.user));
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await invalidateStoredSession();
        return false;
      }
      throw error;
    }
  })().finally(() => {
    refreshRequest = undefined;
  });

  return refreshRequest;
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  retryAuth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const { auth = true, retryAuth = true, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const accessToken = await getAccessToken();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...requestOptions,
    headers,
  });

  if (response.status === 401 && auth && retryAuth && await refreshTokens()) {
    return apiRequest<T>(path, { ...options, retryAuth: false });
  }

  if (response.status === 204) return undefined as T;
  return decodeResponse<T>(response);
}
