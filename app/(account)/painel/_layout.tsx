import { Stack } from 'expo-router';

export default function PanelLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Painel',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Painel' }} />
      <Stack.Screen name="imoveis/index" options={{ title: 'Meus imóveis' }} />
      <Stack.Screen name="imoveis/novo" options={{ title: 'Novo imóvel' }} />
      <Stack.Screen name="imoveis/[id]/editar" options={{ title: 'Editar imóvel' }} />
      <Stack.Screen name="desempenho" options={{ title: 'Desempenho' }} />
      <Stack.Screen name="favoritos" options={{ title: 'Favoritos' }} />
      <Stack.Screen name="assinatura" options={{ title: 'Assinatura' }} />
      <Stack.Screen name="indique-ganhe" options={{ title: 'Indique e ganhe' }} />
      <Stack.Screen name="mensagens" options={{ title: 'Mensagens' }} />
      <Stack.Screen name="perfil" options={{ title: 'Meu perfil' }} />
      <Stack.Screen name="seguranca" options={{ title: 'Segurança' }} />
    </Stack>
  );
}
