import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  isGoogleSignInConfigured,
  requestGoogleAccessToken,
} from '@/features/auth/googleSignIn';
import { colors, spacing } from '@/theme/tokens';
import { getErrorMessage } from '@/utils/format';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'Informe sua senha.'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login, socialLogin, isAuthenticated } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const googleConfigured = isGoogleSignInConfigured();

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
      await login(values.email, values.password);
      router.replace('/painel');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível entrar na conta.'));
    }
  });

  async function handleGoogleLogin() {
    setIsGoogleSubmitting(true);
    setMessage(null);

    try {
      const accessToken = await requestGoogleAccessToken();
      await socialLogin('google', accessToken);
      router.replace('/painel');
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
          <Button
            label={
              isGoogleSubmitting ? 'Conectando ao Google...' : 'Entrar com Google'
            }
            variant="secondary"
            disabled={!googleConfigured}
            loading={isGoogleSubmitting}
            onPress={() => void handleGoogleLogin()}
          />

          {!googleConfigured ? (
            <Text style={styles.configurationNotice}>
              Configure os client IDs e o URL Scheme do Google no arquivo `.env`.
            </Text>
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
              <TextField
                label="Senha"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
                autoComplete="current-password"
                error={errors.password?.message}
              />
            )}
          />

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
