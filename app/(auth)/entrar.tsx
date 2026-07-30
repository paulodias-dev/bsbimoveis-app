import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordField } from '@/components/ui/PasswordField';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getBiometricLoginLabel,
  getBiometricLoginNotice,
} from '@/features/auth/biometricAuth';
import { GoogleAuthSessionButton } from '@/features/auth/GoogleAuthSessionButton';
import {
  getGoogleAuthNotice,
  isGoogleAuthAvailable,
  isGoogleAuthSessionMode,
  isGoogleNativeMode,
} from '@/features/auth/googleAuthConfig';
import { requestGoogleAccessToken } from '@/features/auth/googleSignIn';
import { colors, spacing } from '@/theme/tokens';
import { getErrorMessage } from '@/utils/format';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'Informe sua senha.'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const {
    login,
    loginWithBiometrics,
    socialLogin,
    isAuthenticated,
    biometricLoginAvailable,
    biometricLoginEnabled,
    biometricLoginEmail,
    disableBiometricLogin,
  } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [useBiometricLogin, setUseBiometricLogin] = useState(false);
  const [isBiometricSubmitting, setIsBiometricSubmitting] = useState(false);
  const googleEnabled = isGoogleAuthAvailable();
  const googleNotice = getGoogleAuthNotice();
  const biometricLabel = getBiometricLoginLabel();
  const biometricNotice = getBiometricLoginNotice();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/painel');
    }
  }, [isAuthenticated]);

  const submit = handleSubmit(async (values) => {
    setMessage(null);
    try {
      await login(values.email, values.password, {
        enableBiometric: useBiometricLogin,
      });
      router.replace('/painel');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível entrar na conta.'));
    }
  });

  async function handleBiometricLogin() {
    setIsBiometricSubmitting(true);
    setMessage(null);

    try {
      await loginWithBiometrics();
      router.replace('/painel');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível entrar com biometria.'));
    } finally {
      setIsBiometricSubmitting(false);
    }
  }

  async function completeGoogleLogin(accessToken: string) {
    try {
      await socialLogin('google', accessToken);
      router.replace('/painel');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível entrar com Google.'));
    }
  }

  async function handleGoogleLogin() {
    if (!googleEnabled || !isGoogleNativeMode()) {
      setMessage(googleNotice || 'O login com Google nao esta disponivel agora.');
      return;
    }

    setIsGoogleSubmitting(true);
    setMessage(null);

    try {
      const accessToken = await requestGoogleAccessToken();
      await completeGoogleLogin(accessToken);
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível entrar com Google.'));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Painel do anunciante"
        title="Entre na sua conta"
        description="Gerencie anúncios, favoritos, assinatura e desempenho."
      />

      <Card>
        <View style={styles.form}>
          {biometricLoginEnabled ? (
            <View style={styles.biometricCard}>
              <Text style={styles.biometricTitle}>Acesso rápido com {biometricLabel}</Text>
              <Text style={styles.biometricDescription}>
                Entre sem digitar a senha usando o acesso salvo para {biometricLoginEmail}.
              </Text>
              <Button
                label={
                  isBiometricSubmitting
                    ? `Validando ${biometricLabel}...`
                    : `Entrar com ${biometricLabel}`
                }
                loading={isBiometricSubmitting}
                onPress={() => void handleBiometricLogin()}
              />
              <Button
                label="Remover acesso biométrico deste aparelho"
                variant="secondary"
                onPress={() => void disableBiometricLogin()}
              />
            </View>
          ) : null}

          {isGoogleAuthSessionMode() && googleEnabled ? (
            <GoogleAuthSessionButton
              disabled={!googleEnabled}
              loading={isGoogleSubmitting}
              onAccessToken={completeGoogleLogin}
              onLoadingChange={setIsGoogleSubmitting}
              onMessageChange={setMessage}
            />
          ) : (
            <Button
              label={
                isGoogleSubmitting ? 'Conectando ao Google...' : 'Entrar com Google'
              }
              variant="secondary"
              disabled={!googleEnabled}
              loading={isGoogleSubmitting}
              onPress={() => void handleGoogleLogin()}
            />
          )}

          {googleNotice ? (
            <Text style={styles.configurationNotice}>
              {googleNotice}
            </Text>
          ) : null}

          {biometricNotice && !biometricLoginEnabled ? (
            <Text style={styles.configurationNotice}>{biometricNotice}</Text>
          ) : null}

          <Text style={styles.divider}>ou continue com e-mail</Text>

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
                autoComplete="email"
                keyboardType="email-address"
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
                autoComplete="current-password"
                textContentType="password"
                error={errors.password?.message}
              />
            )}
          />

          {biometricLoginAvailable ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: useBiometricLogin }}
              onPress={() => setUseBiometricLogin((current) => !current)}
              style={styles.terms}
            >
              <View style={[styles.checkbox, useBiometricLogin && styles.checkboxChecked]}>
                {useBiometricLogin ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                Salvar senha com {biometricLabel} neste aparelho para os próximos acessos.
              </Text>
            </Pressable>
          ) : null}

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <Button
            label={isSubmitting ? 'Entrando...' : 'Entrar'}
            loading={isSubmitting}
            onPress={() => void submit()}
          />

          <Button
            label="Esqueci minha senha"
            variant="secondary"
            onPress={() => router.push('/recuperar-senha')}
          />
        </View>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Ainda não tem conta?</Text>
        <Button
          label="Criar conta"
          variant="secondary"
          onPress={() => router.push('/cadastro')}
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
  biometricCard: {
    gap: spacing.sm,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D8E4FF',
    backgroundColor: '#F7FAFF',
  },
  biometricTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  biometricDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
  footer: {
    gap: spacing.md,
  },
  footerText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
