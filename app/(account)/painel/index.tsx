import { lazy, Suspense } from 'react';
import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const DashboardScreen = lazy(() => import('@/screens/account/painel/DashboardScreen'));

export default function DashboardRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando painel..." />}>
      <DashboardScreen />
    </Suspense>
  );
}
