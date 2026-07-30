import type { PropsWithChildren } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius, shadow, spacing } from '@/theme/tokens';

interface GlassCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 42,
  padding = spacing.lg,
}: GlassCardProps) {
  return (
    <View style={[styles.shell, style]}>
      <View style={[styles.content, { padding }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
    ...shadow.card,
  },
  content: {
    position: 'relative',
  },
});
