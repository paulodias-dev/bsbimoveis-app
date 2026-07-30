import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'bsb-imoveis-auth';
const BIOMETRIC_CREDENTIALS_KEY = 'bsb-imoveis-biometric-credentials';
const BIOMETRIC_META_KEY = 'bsb-imoveis-biometric-meta';

interface StoredBiometricCredentials {
  email: string;
  password: string;
}

interface StoredBiometricMeta {
  email: string;
}

async function readValue<T>(
  key: string,
  options?: SecureStore.SecureStoreOptions,
): Promise<T | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? await AsyncStorage.getItem(key)
        : await SecureStore.getItemAsync(key, options);

    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeValue(
  key: string,
  value: unknown | null,
  options?: SecureStore.SecureStoreOptions,
): Promise<void> {
  if (value === null) {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key, options);
    }
    return;
  }

  const serialized = JSON.stringify(value);

  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, serialized);
  } else {
    await SecureStore.setItemAsync(key, serialized, options);
  }
}

export async function readSecureSession<T>(): Promise<T | null> {
  return readValue<T>(STORAGE_KEY);
}

export async function writeSecureSession(value: unknown | null): Promise<void> {
  await writeValue(STORAGE_KEY, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function readBiometricMeta(): Promise<StoredBiometricMeta | null> {
  return readValue<StoredBiometricMeta>(BIOMETRIC_META_KEY);
}

export async function saveBiometricCredentials(
  credentials: StoredBiometricCredentials,
): Promise<void> {
  await writeValue(BIOMETRIC_CREDENTIALS_KEY, credentials, {
    requireAuthentication: true,
    authenticationPrompt: 'Confirme sua biometria para salvar o acesso neste aparelho.',
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await writeValue(BIOMETRIC_META_KEY, { email: credentials.email.trim() });
}

export async function readBiometricCredentials(): Promise<StoredBiometricCredentials | null> {
  return readValue<StoredBiometricCredentials>(BIOMETRIC_CREDENTIALS_KEY, {
    requireAuthentication: true,
    authenticationPrompt: 'Confirme sua biometria para entrar na sua conta.',
  });
}

export async function clearBiometricCredentials(): Promise<void> {
  await writeValue(BIOMETRIC_META_KEY, null);
  await writeValue(BIOMETRIC_CREDENTIALS_KEY, null, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
