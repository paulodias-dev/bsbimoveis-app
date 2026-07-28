import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PropertyFormValues } from './schema';

const STORAGE_KEY = 'bsbimoveis:property-wizard:draft';

export interface PropertyWizardDraft {
  propertyId: number | null;
  currentStep: number;
  maxUnlockedStep: number;
  values: PropertyFormValues;
  savedAt: string;
}

export async function loadPropertyDraft(): Promise<PropertyWizardDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PropertyWizardDraft) : null;
  } catch {
    return null;
  }
}

export async function savePropertyDraft(
  draft: Omit<PropertyWizardDraft, 'savedAt'>,
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
  );
}

export async function clearPropertyDraft(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
