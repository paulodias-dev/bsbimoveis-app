import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'bsb-imoveis-auth';

export async function readSecureSession<T>(): Promise<T | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? await AsyncStorage.getItem(STORAGE_KEY)
        : await SecureStore.getItemAsync(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeSecureSession(value: unknown | null): Promise<void> {
  if (value === null) {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
    return;
  }

  const serialized = JSON.stringify(value);

  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEY, serialized, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
}
