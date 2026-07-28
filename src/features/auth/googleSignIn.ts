import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { env } from '@/config/env';

let configured = false;

function ensureConfigured() {
  if (configured) return;

  GoogleSignin.configure({
    webClientId: env.googleWebClientId || undefined,
    iosClientId: env.googleIosClientId || undefined,
    offlineAccess: false,
  });

  configured = true;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(env.googleWebClientId || env.googleIosClientId);
}

export async function requestGoogleAccessToken(): Promise<string> {
  ensureConfigured();

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
  ensureConfigured();

  try {
    await GoogleSignin.signOut();
  } catch {
    // A conta pode não ter uma sessão Google ativa no dispositivo.
  }
}
