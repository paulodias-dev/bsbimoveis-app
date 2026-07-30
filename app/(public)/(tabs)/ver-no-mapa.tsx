import { lazy, Suspense } from 'react';
import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const MapTabScreen = lazy(() => import('@/screens/public/MapTabScreen'));

export default function MapTabRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando mapa..." />}>
      <MapTabScreen />
    </Suspense>
  );
}
