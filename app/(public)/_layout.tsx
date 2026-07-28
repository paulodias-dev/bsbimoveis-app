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
      <Stack.Screen
        name="anunciar"
        options={{
          title: 'Anunciar imóvel',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="planos"
        options={{
          title: 'Planos',
          headerBackTitle: 'Voltar',
        }}
      />
    </Stack>
  );
}
