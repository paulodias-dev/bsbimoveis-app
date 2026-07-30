import { lazy, Suspense } from 'react';
import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const PropertyWizardScreen = lazy(() =>
  import('@/features/properties/form/PropertyWizardScreen').then((module) => ({
    default: module.PropertyWizardScreen,
  })),
);

export default function NewPropertyRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando cadastro do imóvel..." />}>
      <PropertyWizardScreen />
    </Suspense>
  );
}
