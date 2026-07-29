import { BlurView } from 'expo-blur';
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
      <BlurView
        intensity={intensity}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.tint, StyleSheet.absoluteFill]} />
      <View style={[styles.content, { padding }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.48)',
    ...shadow.card,
  },
  tint: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
