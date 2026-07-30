import { lazy, Suspense } from 'react';
import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const HomeTabScreen = lazy(() => import('@/screens/public/HomeTabScreen'));

export default function HomeTabRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando início..." />}>
      <HomeTabScreen />
    </Suspense>
  );
}
