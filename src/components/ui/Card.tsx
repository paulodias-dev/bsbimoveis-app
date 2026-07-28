import { usePathname } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const pathname = usePathname();
  const isPanel = pathname.startsWith('/painel');

  return <View style={[styles.card, isPanel && styles.panelCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadow.card,
  },
  panelCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.64)',
    shadowColor: '#344054',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 4,
  },
});
