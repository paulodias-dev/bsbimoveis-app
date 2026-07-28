import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="imoveis/[id]"
        options={{
          title: 'Detalhes do imóvel',
          headerBackTitle: 'Voltar',
        }}
      />
    </Stack>
  );
}
