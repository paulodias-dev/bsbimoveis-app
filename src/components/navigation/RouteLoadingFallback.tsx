import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';

interface RouteLoadingFallbackProps {
  title: string;
}

export function RouteLoadingFallback({ title }: RouteLoadingFallbackProps) {
  return (
    <Screen>
      <StateView title={title} loading />
    </Screen>
  );
}
