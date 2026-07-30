import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { apiClient, configureApiClient } from '@/services/apiClient';
import { isBiometricLoginAvailable } from '@/features/auth/biometricAuth';
import { signOutGoogle } from '@/features/auth/googleSignIn';
import { usePainelStore } from '@/stores/usePainelStore';
import {
  clearBiometricCredentials,
  readBiometricCredentials,
  readBiometricMeta,
  readSecureSession,
  saveBiometricCredentials,
  writeSecureSession,
} from '@/services/authStorage';
import type {
  AuthResponse,
  AuthUser,
  MessageResponse,
  ResourceResponse,
} from '@/types/api';

interface StoredSession {
  accessToken: string;
  user: AuthUser;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  terms_accepted: boolean;
  document_version: number;
  role?: string;
  referral_code?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  biometricLoginAvailable: boolean;
  biometricLoginEnabled: boolean;
  biometricLoginEmail: string | null;
  login: (
    email: string,
    password: string,
    options?: { enableBiometric?: boolean },
  ) => Promise<AuthResponse>;
  loginWithBiometrics: () => Promise<AuthResponse>;
  socialLogin: (provider: 'google', socialAccessToken: string) => Promise<AuthResponse>;
  registerAccount: (
    payload: RegisterPayload,
    options?: { enableBiometric?: boolean },
  ) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<MessageResponse>;
  disableBiometricLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [biometricLoginEmail, setBiometricLoginEmail] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const biometricLoginAvailable = isBiometricLoginAvailable();

  const persistSession = useCallback(async (response: AuthResponse) => {
    tokenRef.current = response.access_token;
    setAccessToken(response.access_token);
    setUser(response.user);
    await writeSecureSession({
      accessToken: response.access_token,
      user: response.user,
    });
  }, []);

  const disableBiometricLogin = useCallback(async () => {
    setBiometricLoginEmail(null);
    await clearBiometricCredentials();
  }, []);

  const enableBiometricLogin = useCallback(
    async (email: string, password: string) => {
      if (!biometricLoginAvailable) return;

      await saveBiometricCredentials({
        email: email.trim(),
        password,
      });
      setBiometricLoginEmail(email.trim());
    },
    [biometricLoginAvailable],
  );

  const clearSession = useCallback(async () => {
    tokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    await writeSecureSession(null);
    usePainelStore.getState().reset();
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokenRef.current) return null;

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = apiClient
        .post<AuthResponse>('/auth/refresh', undefined, {
          skipAuthRefresh: true,
        })
        .then(async (response) => {
          await persistSession(response);
          return response.access_token;
        })
        .catch(async () => {
          await clearSession();
          return null;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, [clearSession, persistSession]);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => tokenRef.current,
      refreshAccessToken,
      clearAuth: clearSession,
    });
  }, [clearSession, refreshAccessToken]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const [stored, biometricMeta] = await Promise.all([
        readSecureSession<StoredSession>(),
        readBiometricMeta(),
      ]);

      if (active) {
        setBiometricLoginEmail(biometricMeta?.email ?? null);
      }

      if (!stored?.accessToken) {
        if (active) setIsBootstrapping(false);
        return;
      }

      tokenRef.current = stored.accessToken;
      setAccessToken(stored.accessToken);
      setUser(stored.user);

      try {
        const response = await apiClient.get<ResourceResponse<AuthUser>>('/auth/me');
        if (!active) return;

        setUser(response.data);
        await writeSecureSession({
          accessToken: stored.accessToken,
          user: response.data,
        });
      } catch {
        if (active) await clearSession();
      } finally {
        if (active) setIsBootstrapping(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      options?: { enableBiometric?: boolean },
    ) => {
      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        { email: email.trim(), password, remember: true },
        { auth: false, skipAuthRefresh: true },
      );
      await persistSession(response);
      if (options?.enableBiometric) {
        try {
          await enableBiometricLogin(email, password);
        } catch {
          // Keep the account logged in even if the device biometrics fail to save.
        }
      }
      return response;
    },
    [enableBiometricLogin, persistSession],
  );

  const loginWithBiometrics = useCallback(async () => {
    const credentials = await readBiometricCredentials();

    if (!credentials?.email || !credentials.password) {
      await disableBiometricLogin();
      throw new Error('Não encontramos um acesso biométrico salvo neste aparelho.');
    }

    return login(credentials.email, credentials.password, { enableBiometric: true });
  }, [disableBiometricLogin, login]);

  const socialLogin = useCallback(
    async (provider: 'google', socialAccessToken: string) => {
      const response = await apiClient.post<AuthResponse>(
        '/auth/social',
        { provider, access_token: socialAccessToken },
        { auth: false, skipAuthRefresh: true },
      );
      await persistSession(response);
      return response;
    },
    [persistSession],
  );

  const registerAccount = useCallback(
    async (
      payload: RegisterPayload,
      options?: { enableBiometric?: boolean },
    ) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', payload, {
        auth: false,
        skipAuthRefresh: true,
      });
      await persistSession(response);
      if (options?.enableBiometric) {
        try {
          await enableBiometricLogin(payload.email, payload.password);
        } catch {
          // Keep the account created even if the device biometrics fail to save.
        }
      }
      return response;
    },
    [enableBiometricLogin, persistSession],
  );

  const forgotPassword = useCallback(
    (email: string) =>
      apiClient.post<MessageResponse>(
        '/auth/forgot-password',
        { email: email.trim() },
        { auth: false, skipAuthRefresh: true },
      ),
    [],
  );

  const logout = useCallback(async () => {
    try {
      if (tokenRef.current) {
        await apiClient.post<MessageResponse>('/auth/logout', undefined, {
          skipAuthRefresh: true,
        });
      }
    } finally {
      await signOutGoogle();
      await disableBiometricLogin();
      await clearSession();
    }
  }, [clearSession, disableBiometricLogin]);

  const refreshProfile = useCallback(async () => {
    const response = await apiClient.get<ResourceResponse<AuthUser>>('/auth/me');
    setUser(response.data);

    if (tokenRef.current) {
      await writeSecureSession({
        accessToken: tokenRef.current,
        user: response.data,
      });
    }

    return response.data;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isBootstrapping,
      biometricLoginAvailable,
      biometricLoginEnabled: Boolean(biometricLoginEmail),
      biometricLoginEmail,
      login,
      loginWithBiometrics,
      socialLogin,
      registerAccount,
      forgotPassword,
      disableBiometricLogin,
      logout,
      refreshProfile,
    }),
    [
      accessToken,
      biometricLoginAvailable,
      biometricLoginEmail,
      disableBiometricLogin,
      forgotPassword,
      isBootstrapping,
      login,
      loginWithBiometrics,
      logout,
      refreshProfile,
      registerAccount,
      socialLogin,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
