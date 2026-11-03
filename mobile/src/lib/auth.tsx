import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { apiRequest } from '@/lib/api';
import {
  clearStoredSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  listenForSessionInvalidation,
  storeSession,
} from '@/lib/auth-storage';

export interface User {
  id: string;
  display_name: string;
  email: string;
  role: 'learner' | 'trainer';
  avatar_url: string | null;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string, role: User['role']) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = listenForSessionInvalidation(() => setUser(null));
    async function restoreSession() {
      const [storedUser, accessToken, refreshToken] = await Promise.all([
        getStoredUser(),
        getAccessToken(),
        getRefreshToken(),
      ]);
      if (storedUser && (accessToken || refreshToken)) {
        try {
          setUser(JSON.parse(storedUser) as User);
        } catch (error) {
          console.error('Unable to restore the saved user session', error);
          await clearStoredSession();
        }
      }
      setReady(true);
    }

    restoreSession().catch((error: unknown) => {
      console.error('Unable to read the saved user session', error);
      setReady(true);
    });

    return unsubscribe;
  }, []);

  const saveAuthResponse = useCallback(async (response: AuthResponse) => {
    await storeSession(response.accessToken, response.refreshToken, JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    });
    await saveAuthResponse(response);
  }, [saveAuthResponse]);

  const register = useCallback(async (
    displayName: string,
    email: string,
    password: string,
    role: User['role'],
  ) => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName, email, password, role }),
      auth: false,
    });
    await saveAuthResponse(response);
  }, [saveAuthResponse]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          auth: false,
        });
      }
    } finally {
      await clearStoredSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
