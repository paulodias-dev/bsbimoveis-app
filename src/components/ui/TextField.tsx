import { usePathname } from 'expo-router';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, style, ...props }: TextFieldProps) {
  const pathname = usePathname();
  const isPanel = pathname.startsWith('/painel');

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, isPanel && styles.panelLabel]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, isPanel && styles.panelInput, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  panelLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  panelInput: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EAF3',
    backgroundColor: '#FBFCFE',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
