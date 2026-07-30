import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme/tokens';

function TabIcon({ value, focused }: { value: string; focused: boolean }) {
  return <Text style={[styles.icon, focused && styles.iconFocused]}>{value}</Text>;
}

export default function PublicTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: layout.publicTabBarHeight + Math.max(insets.bottom, 8),
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ],
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon value="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ focused }) => <TabIcon value="⌕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ver-no-mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused }) => <TabIcon value="⌖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ focused }) => <TabIcon value="♡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="conta"
        options={{
          title: 'Conta',
          tabBarIcon: ({ focused }) => <TabIcon value="◎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="imoveis/[id]"
        options={{
          href: null,
          title: 'Detalhes do imóvel',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 7,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  icon: {
    color: colors.textMuted,
    fontSize: 23,
    fontWeight: '700',
  },
  iconFocused: {
    color: colors.brand,
  },
});
