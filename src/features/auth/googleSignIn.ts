import { isRunningInExpoGo } from 'expo';
import { env } from '@/config/env';
import {
  isGoogleNativeConfigured,
  isGoogleNativeMode,
} from '@/features/auth/googleAuthConfig';

let configured = false;
let googleSignInModulePromise:
  | Promise<typeof import('@react-native-google-signin/google-signin')>
  | null = null;

async function getGoogleSignInModule() {
  if (!isGoogleNativeMode()) {
    throw new Error(
      'O login com Google esta configurado para usar outro modo. Ajuste EXPO_PUBLIC_GOOGLE_AUTH_MODE.',
    );
  }

  if (isRunningInExpoGo()) {
    throw new Error(
      'O login com Google nao funciona no Expo Go. Use um Development Build.',
    );
  }

  googleSignInModulePromise ??= import('@react-native-google-signin/google-signin');
  return googleSignInModulePromise;
}

async function ensureConfigured() {
  if (configured) return;

  const { GoogleSignin } = await getGoogleSignInModule();
  GoogleSignin.configure({
    webClientId: env.googleWebClientId || undefined,
    iosClientId: env.googleIosClientId || undefined,
    offlineAccess: false,
  });

  configured = true;
}

export function isGoogleSignInConfigured(): boolean {
  return isGoogleNativeConfigured();
}

export async function requestGoogleAccessToken(): Promise<string> {
  await ensureConfigured();
  const { GoogleSignin, isSuccessResponse } = await getGoogleSignInModule();

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    throw new Error('O login com Google foi cancelado.');
  }

  const tokens = await GoogleSignin.getTokens();
  if (!tokens.accessToken) {
    throw new Error('O Google não retornou um token de acesso.');
  }

  return tokens.accessToken;
}

export async function signOutGoogle(): Promise<void> {
  if (isRunningInExpoGo() || !isGoogleNativeMode()) {
    return;
  }

  await ensureConfigured();

  try {
    const { GoogleSignin } = await getGoogleSignInModule();
    await GoogleSignin.signOut();
  } catch {
    // A conta pode não ter uma sessão Google ativa no dispositivo.
  }
}
