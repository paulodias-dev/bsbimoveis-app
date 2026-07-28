import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/tokens';

function TabIcon({ value, focused }: { value: string; focused: boolean }) {
  return <Text style={[styles.icon, focused && styles.iconFocused]}>{value}</Text>;
}

export default function PublicTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    paddingTop: 7,
    paddingBottom: 8,
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
