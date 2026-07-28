import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Voltar',
      }}
    >
      <Stack.Screen name="entrar" options={{ title: 'Entrar' }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      <Stack.Screen
        name="recuperar-senha"
        options={{ title: 'Recuperar senha' }}
      />
    </Stack>
  );
}
