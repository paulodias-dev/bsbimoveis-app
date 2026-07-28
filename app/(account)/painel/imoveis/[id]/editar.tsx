import { useLocalSearchParams } from 'expo-router';
import { PropertyWizardScreen } from '@/features/properties/form/PropertyWizardScreen';

export default function EditPropertyScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const propertyId = Number(params.id);

  return <PropertyWizardScreen propertyId={propertyId} />;
}
