import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordField } from '@/components/ui/PasswordField';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { GoogleAuthSessionButton } from '@/features/auth/GoogleAuthSessionButton';
import {
  getGoogleAuthNotice,
  isGoogleAuthAvailable,
  isGoogleAuthSessionMode,
  isGoogleNativeMode,
} from '@/features/auth/googleAuthConfig';
import { requestGoogleAccessToken } from '@/features/auth/googleSignIn';
import {
  getPasswordRequirementState,
  getPasswordStrengthMeta,
  isStrongPassword,
} from '@/features/auth/passwordRules';
import { colors, radius, spacing } from '@/theme/tokens';
import { getErrorMessage } from '@/utils/format';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.'),
    email: z.string().email('Informe um e-mail válido.'),
    password: z
      .string()
      .min(1, 'Informe uma senha.')
      .refine(isStrongPassword, {
        message:
          'Use no mínimo 8 caracteres com letra minúscula, maiúscula, número e símbolo.',
      }),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não conferem.',
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { registerAccount, socialLogin } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const googleEnabled = isGoogleAuthAvailable();
  const googleNotice = getGoogleAuthNotice();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    },
  });

  const passwordValue = watch('password') || '';
  const passwordStrength = getPasswordStrengthMeta(passwordValue);
  const passwordChecks = getPasswordRequirementState(passwordValue);

  const submit = handleSubmit(async (values) => {
    if (!termsAccepted) {
      setMessage('Aceite os Termos de Uso para continuar.');
      return;
    }

    setMessage(null);

    try {
      await registerAccount({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        terms_accepted: true,
        document_version: 1,
      });
      router.replace('/painel');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível criar sua conta.'));
    }
  });

  async function completeGoogleRegister(accessToken: string) {
    try {
      await socialLogin('google', accessToken);
      router.replace('/painel');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível continuar com Google.'));
    }
  }

  async function handleGoogleRegister() {
    if (!googleEnabled || !isGoogleNativeMode()) {
      setMessage(googleNotice || 'O login com Google não está disponível agora.');
      return;
    }

    setIsGoogleSubmitting(true);
    setMessage(null);

    try {
      const accessToken = await requestGoogleAccessToken();
      await completeGoogleRegister(accessToken);
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível continuar com Google.'));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Conta gratuita"
        title="Crie sua conta"
        description="Cadastre-se com e-mail ou Google e acompanhe a qualidade da sua senha em tempo real."
      />

      <Card>
        <View style={styles.form}>
          {isGoogleAuthSessionMode() && googleEnabled ? (
            <GoogleAuthSessionButton
              disabled={!googleEnabled}
              loading={isGoogleSubmitting}
              onAccessToken={completeGoogleRegister}
              onLoadingChange={setIsGoogleSubmitting}
              onMessageChange={setMessage}
            />
          ) : (
            <Button
              label={
                isGoogleSubmitting ? 'Conectando ao Google...' : 'Continuar com Google'
              }
              variant="secondary"
              disabled={!googleEnabled}
              loading={isGoogleSubmitting}
              onPress={() => void handleGoogleRegister()}
            />
          )}

          {googleNotice ? (
            <Text style={styles.configurationNotice}>{googleNotice}</Text>
          ) : null}

          <Text style={styles.divider}>ou continue com e-mail</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Nome"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoCapitalize="words"
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="E-mail"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                label="Senha"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoComplete="new-password"
                textContentType="newPassword"
                error={errors.password?.message}
              />
            )}
          />

          <View style={styles.passwordPanel}>
            <View style={styles.passwordStrengthRow}>
              <Text style={styles.passwordStrengthLabel}>Força da senha</Text>
              <Text
                style={[
                  styles.passwordStrengthValue,
                  passwordStrength.tone === 'weak' && styles.passwordStrengthWeak,
                  passwordStrength.tone === 'medium' && styles.passwordStrengthMedium,
                  passwordStrength.tone === 'strong' && styles.passwordStrengthStrong,
                ]}
              >
                {passwordStrength.label}
              </Text>
            </View>

            <View style={styles.passwordMeterTrack}>
              <View
                style={[
                  styles.passwordMeterFill,
                  { width: `${passwordStrength.progress * 100}%` },
                  passwordStrength.tone === 'weak' && styles.passwordMeterWeak,
                  passwordStrength.tone === 'medium' && styles.passwordMeterMedium,
                  passwordStrength.tone === 'strong' && styles.passwordMeterStrong,
                ]}
              />
            </View>

            <View style={styles.passwordChecklist}>
              {passwordChecks.map((item) => (
                <View key={item.id} style={styles.passwordChecklistItem}>
                  <View
                    style={[
                      styles.passwordChecklistIcon,
                      item.met && styles.passwordChecklistIconMet,
                    ]}
                  >
                    {item.met ? <Text style={styles.passwordChecklistCheck}>✓</Text> : null}
                  </View>
                  <Text
                    style={[
                      styles.passwordChecklistText,
                      item.met && styles.passwordChecklistTextMet,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Controller
            control={control}
            name="passwordConfirmation"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                label="Confirmar senha"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoComplete="new-password"
                textContentType="newPassword"
                error={errors.passwordConfirmation?.message}
              />
            )}
          />

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            onPress={() => setTermsAccepted((current) => !current)}
            style={styles.terms}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.termsText}>
              Li e concordo com os Termos de Uso e a Política de Privacidade.
            </Text>
          </Pressable>

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <Button
            label={isSubmitting ? 'Criando conta...' : 'Criar conta'}
            loading={isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já tem uma conta?</Text>
        <Button
          label="Entrar"
          variant="secondary"
          onPress={() => router.push('/entrar')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  divider: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  configurationNotice: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  passwordPanel: {
    gap: spacing.sm,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D8E4FF',
    backgroundColor: '#F7FAFF',
  },
  passwordStrengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  passwordStrengthLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  passwordStrengthValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  passwordStrengthWeak: {
    color: '#D92D20',
  },
  passwordStrengthMedium: {
    color: '#B54708',
  },
  passwordStrengthStrong: {
    color: '#1570EF',
  },
  passwordMeterTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: '#E4E7EC',
  },
  passwordMeterFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: '#98A2B3',
  },
  passwordMeterWeak: {
    backgroundColor: '#F04438',
  },
  passwordMeterMedium: {
    backgroundColor: '#F79009',
  },
  passwordMeterStrong: {
    backgroundColor: '#12B76A',
  },
  passwordChecklist: {
    gap: spacing.sm,
  },
  passwordChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  passwordChecklistIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  passwordChecklistIconMet: {
    borderColor: '#12B76A',
    backgroundColor: '#12B76A',
  },
  passwordChecklistCheck: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  passwordChecklistText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  passwordChecklistTextMet: {
    color: colors.text,
    fontWeight: '800',
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  check: {
    color: colors.white,
    fontWeight: '900',
  },
  termsText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    gap: spacing.md,
  },
  footerText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
