import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from 'react-native';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  error?: string;
  hint?: string;
}

export function PasswordField({
  label,
  error,
  hint,
  style,
  ...props
}: PasswordFieldProps) {
  const pathname = usePathname();
  const isPanel = pathname.startsWith('/painel');
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, isPanel && styles.panelLabel]}>{label}</Text>
      <View style={[styles.field, isPanel && styles.panelField, error && styles.fieldError]}>
        <TextInput
          {...props}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onPress={() => setVisible((current) => !current)}
          hitSlop={8}
          style={styles.toggle}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.brand}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  panelLabel: { fontSize: 13, fontWeight: '800' },
  field: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelField: {
    minHeight: 52,
    borderRadius: 18,
    borderColor: '#E4EAF3',
    backgroundColor: '#FBFCFE',
  },
  fieldError: { borderColor: colors.danger },
  input: {
    flex: 1,
    minHeight: 48,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  toggle: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: colors.danger, fontSize: 12 },
  hint: { color: colors.textMuted, fontSize: 12 },
});
