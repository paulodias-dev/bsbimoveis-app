import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  icon,
  style,
  ...props
}: ButtonProps) {
  const pathname = usePathname();
  const isPanel = pathname.startsWith('/painel');
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isPanel && styles.panelBase,
        isPanel && variant === 'primary' && styles.panelPrimary,
        isPanel && variant === 'secondary' && styles.panelSecondary,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.brand : colors.white} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variant === 'secondary' && styles.secondaryLabel,
              isPanel && styles.panelLabel,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.brand,
  },
  secondary: {
    backgroundColor: colors.brandSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  panelBase: {
    minHeight: 50,
    borderRadius: 18,
  },
  panelPrimary: {
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 5,
  },
  panelSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.52,
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  panelLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryLabel: {
    color: colors.brandDark,
  },
});
