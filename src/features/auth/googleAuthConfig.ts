import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { env, type GoogleAuthMode } from '@/config/env';

function getGoogleAuthSessionClientId(): string {
  if (Platform.OS === 'android') return env.googleAndroidClientId;
  if (Platform.OS === 'ios') return env.googleIosClientId;
  return env.googleWebClientId;
}

function getGoogleAuthSessionClientIdName(): string {
  if (Platform.OS === 'android') return 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';
  if (Platform.OS === 'ios') return 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID';
  return 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID';
}

export function getGoogleAuthMode(): GoogleAuthMode {
  return env.googleAuthMode;
}

export function isGoogleNativeMode(): boolean {
  return getGoogleAuthMode() === 'native';
}

export function isGoogleAuthSessionMode(): boolean {
  return getGoogleAuthMode() === 'authsession';
}

export function isGoogleAuthDisabledMode(): boolean {
  return getGoogleAuthMode() === 'disabled';
}

export function isGoogleNativeConfigured(): boolean {
  return Boolean(env.googleWebClientId || env.googleIosClientId);
}

export function isGoogleAuthSessionConfigured(): boolean {
  return Boolean(getGoogleAuthSessionClientId());
}

export function isGoogleAuthAvailable(): boolean {
  if (isGoogleAuthDisabledMode()) return false;
  if (isRunningInExpoGo()) return false;

  if (isGoogleNativeMode()) {
    return isGoogleNativeConfigured();
  }

  return isGoogleAuthSessionConfigured();
}

export function getGoogleAuthNotice(): string | null {
  if (isGoogleAuthDisabledMode()) {
    return 'Login com Google desativado via EXPO_PUBLIC_GOOGLE_AUTH_MODE=disabled.';
  }

  if (isGoogleNativeMode()) {
    if (isRunningInExpoGo()) {
      return 'O SDK nativo do Google nao funciona no Expo Go. Use Development Build ou desative o Google no .env.';
    }

    if (!isGoogleNativeConfigured()) {
      return 'Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e, no iOS, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID para usar o SDK nativo.';
    }

    return null;
  }

  if (isRunningInExpoGo()) {
    return 'O Expo Go nao suporta testes locais de OAuth com AuthSession. Use Development Build ou desative o Google no .env.';
  }

  if (!isGoogleAuthSessionConfigured()) {
    return `Configure ${getGoogleAuthSessionClientIdName()} para usar EXPO_PUBLIC_GOOGLE_AUTH_MODE=authsession.`;
  }

  return null;
}
