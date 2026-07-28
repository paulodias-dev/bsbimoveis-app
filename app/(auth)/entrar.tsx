import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordField } from '@/components/ui/PasswordField';
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
type Params = {
  intent?: string;
  plan?: string;
  profile?: string;
  listing_draft_id?: string;
  listing_draft_token?: string;
};

export default function LoginScreen() {
  const params = useLocalSearchParams<Params>();
  const { login, socialLogin, isAuthenticated } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const googleConfigured = isGoogleSignInConfigured();

  const target = useMemo(() => {
    if (params.intent === 'subscribe' && params.plan) {
      return { pathname: '/painel/assinatura' as const, params: { plan: params.plan } };
    }
    if (params.intent === 'publish') return '/painel/imoveis/novo' as const;
    return '/painel' as const;
  }, [params.intent, params.plan]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace(target);
  }, [isAuthenticated, target]);

  const submit = handleSubmit(async (values) => {
    setMessage(null);
    try {
      await login(values.email, values.password);
      router.replace(target);
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
      router.replace(target);
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

      {(params.intent || params.plan || params.profile) ? (
        <Card style={styles.contextCard}>
          <Text style={styles.contextTitle}>Seu destino será preservado</Text>
          <Text style={styles.contextText}>
            {params.intent === 'publish'
              ? 'Depois do login, você continuará no cadastro do imóvel.'
              : params.plan
                ? 'Depois do login, você continuará no plano selecionado.'
                : 'Depois do login, você continuará no painel.'}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.formCard}>
        <Button
          label={isGoogleSubmitting ? 'Conectando ao Google...' : 'Entrar com Google'}
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
          render={({ field, fieldState }) => (
            <TextField
              label="E-mail"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordField
              label="Senha"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              autoComplete="current-password"
              textContentType="password"
              error={fieldState.error?.message}
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
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Ainda não tem conta?</Text>
        <Button
          label="Criar conta"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/cadastro',
              params: {
                intent: params.intent ?? '',
                plan: params.plan ?? '',
                profile: params.profile ?? '',
                listing_draft_id: params.listing_draft_id ?? '',
                listing_draft_token: params.listing_draft_token ?? '',
              },
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contextCard: { gap: spacing.xs, backgroundColor: colors.surfaceAlt },
  contextTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  contextText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  formCard: { gap: spacing.md },
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
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  footer: { gap: spacing.md },
  footerText: { color: colors.textMuted, textAlign: 'center' },
});
