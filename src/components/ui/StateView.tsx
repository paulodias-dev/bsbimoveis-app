import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { Button } from './Button';

interface StateViewProps {
  title: string;
  description?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function StateView({
  title,
  description,
  loading = false,
  actionLabel,
  onAction,
}: StateViewProps) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color={colors.brand} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
