import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  PanelBackground,
  PanelBottomBar,
  PanelChromeProvider,
  PanelDrawer,
  PanelHeader,
} from '@/features/panel/PanelChrome';

export default function PanelLayout() {
  return (
    <PanelChromeProvider>
      <View style={styles.root}>
        <PanelBackground />
        <Stack
          screenOptions={{
            header: () => <PanelHeader />,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="imoveis/index" />
          <Stack.Screen name="imoveis/novo" />
          <Stack.Screen name="imoveis/[id]/editar" />
          <Stack.Screen name="desempenho" />
          <Stack.Screen name="favoritos" />
          <Stack.Screen name="assinatura" />
          <Stack.Screen name="indique-ganhe" />
          <Stack.Screen name="mensagens" />
          <Stack.Screen name="perfil" />
          <Stack.Screen name="seguranca" />
        </Stack>
        <PanelBottomBar />
        <PanelDrawer />
      </View>
    </PanelChromeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
});
