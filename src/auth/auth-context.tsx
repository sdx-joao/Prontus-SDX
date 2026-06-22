import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '../api/client';
import { clearToken, getToken, markDeviceRegistered, saveToken } from './token-store';
import type { LoginResponse, MobileUser } from './types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Shape consumido pelas telas (Home/Perfil)
export type SessionUser = {
  name: string;
  dept: string;
  unit: string;
  role: string;
  username: string;
  avatarUrl: string | null;
};

function toSessionUser(u: MobileUser): SessionUser {
  return {
    name: u.fullName || u.username,
    dept: u.department || u.role,
    unit: '',
    role: u.role,
    username: u.username,
    avatarUrl: u.avatarUrl ?? null,
  };
}

type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  token: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Bootstrap: reusa o token salvo e revalida em /api/mobile/me
  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken();
        if (!stored) {
          setStatus('unauthenticated');
          return;
        }
        const me = await apiFetch<MobileUser>('/api/mobile/me', { token: stored });
        setToken(stored);
        setUser(toSessionUser(me));
        setStatus('authenticated');
      } catch {
        await clearToken();
        setStatus('unauthenticated');
      }
    })();
  }, []);

  async function signIn(username: string, password: string) {
    const res = await apiFetch<LoginResponse>('/api/mobile/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    await saveToken(res.token);
    setToken(res.token);
    setUser(toSessionUser(res.user));
    setStatus('authenticated');
    // Enriquece a sessão com avatar e demais campos (login devolve o mínimo).
    try {
      const me = await apiFetch<MobileUser>('/api/mobile/me', { token: res.token });
      setUser(toSessionUser(me));
    } catch {
      // mantém os dados do login se /me falhar
    }
  }

  // Auto-cadastro (só ambiente de teste). Cria o usuário, marca o aparelho como
  // já cadastrado (trava de 1 por aparelho) e já entra.
  async function signUp(username: string, password: string, fullName: string) {
    const res = await apiFetch<LoginResponse>('/api/mobile/auth/register', {
      method: 'POST',
      body: { username, password, fullName },
    });
    await saveToken(res.token);
    await markDeviceRegistered(username);
    setToken(res.token);
    setUser(toSessionUser(res.user));
    setStatus('authenticated');
    try {
      const me = await apiFetch<MobileUser>('/api/mobile/me', { token: res.token });
      setUser(toSessionUser(me));
    } catch {
      // mantém os dados do registro se /me falhar
    }
  }

  async function signOut() {
    await clearToken();
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, signIn, signUp, signOut }),
    [status, user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
