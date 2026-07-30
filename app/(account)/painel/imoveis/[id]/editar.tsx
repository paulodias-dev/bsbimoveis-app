import { lazy, Suspense } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const PropertyWizardScreen = lazy(() =>
  import('@/features/properties/form/PropertyWizardScreen').then((module) => ({
    default: module.PropertyWizardScreen,
  })),
);

export default function EditPropertyRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const propertyId = Number(params.id);

  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando edição do imóvel..." />}>
      <PropertyWizardScreen propertyId={propertyId} />
    </Suspense>
  );
}
