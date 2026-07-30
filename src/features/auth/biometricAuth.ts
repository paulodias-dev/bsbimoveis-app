import { isRunningInExpoGo } from 'expo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export function isBiometricLoginAvailable() {
  if (Platform.OS === 'web') return false;
  if (isRunningInExpoGo()) return false;

  try {
    return SecureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

export function getBiometricLoginNotice() {
  if (Platform.OS === 'web') {
    return 'A biometria não está disponível na versão web.';
  }

  if (isRunningInExpoGo()) {
    return 'A biometria requer um Development Build ou o app publicado; no Expo Go esse recurso fica desativado.';
  }

  if (!isBiometricLoginAvailable()) {
    return 'Ative Face ID, Touch ID ou biometria no aparelho para usar este acesso rápido.';
  }

  return null;
}

export function getBiometricLoginLabel() {
  if (Platform.OS === 'ios') {
    return 'Face ID / Touch ID';
  }

  return 'Biometria';
}
