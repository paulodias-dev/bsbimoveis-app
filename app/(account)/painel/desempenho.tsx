import { lazy, Suspense } from 'react';
import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const PerformanceScreen = lazy(() => import('@/screens/account/painel/PerformanceScreen'));

export default function PerformanceRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando desempenho..." />}>
      <PerformanceScreen />
    </Suspense>
  );
}
