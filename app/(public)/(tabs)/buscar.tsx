import { lazy, Suspense } from 'react';
import { RouteLoadingFallback } from '@/components/navigation/RouteLoadingFallback';

const SearchTabScreen = lazy(() => import('@/screens/public/SearchTabScreen'));

export default function SearchTabRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback title="Carregando busca..." />}>
      <SearchTabScreen />
    </Suspense>
  );
}
