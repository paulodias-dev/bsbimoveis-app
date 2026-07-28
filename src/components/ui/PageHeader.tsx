import { usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  const pathname = usePathname();
  const isPanel = pathname.startsWith('/painel');

  return (
    <View style={[styles.container, isPanel && styles.panelContainer]}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, isPanel && styles.panelEyebrow]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, isPanel && styles.panelTitle]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, isPanel && styles.panelDescription]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  panelContainer: {
    gap: 5,
  },
  eyebrow: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  panelEyebrow: {
    fontSize: 9,
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
  },
  panelTitle: {
    fontSize: 24,
    lineHeight: 29,
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  panelDescription: {
    maxWidth: 580,
    fontSize: 13,
    lineHeight: 19,
  },
});
