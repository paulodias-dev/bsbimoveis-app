import { Redirect, Stack } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';

export default function AccountLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <Screen>
        <StateView title="Validando sua sessão..." loading />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/entrar" />;
  }

  return (
    <Stack>
      <Stack.Screen name="painel" options={{ headerShown: false }} />
    </Stack>
  );
}
