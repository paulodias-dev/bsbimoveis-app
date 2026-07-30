import { lazy, Suspense } from 'react';
import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const PropertyDetailScreen = lazy(() => import('@/screens/public/PropertyDetailScreen'));

export default function PropertyDetailRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando imóvel..." />}>
      <PropertyDetailScreen />
    </Suspense>
  );
}
