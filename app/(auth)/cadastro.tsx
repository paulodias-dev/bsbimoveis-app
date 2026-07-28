import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { TermsAgreement } from '@/features/legal/TermsAgreement';
import { colors, spacing } from '@/theme/tokens';
import { getErrorMessage } from '@/utils/format';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.'),
    email: z.string().email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    passwordConfirmation: z.string(),
    referralCode: z.string().trim().max(40, 'Cupom muito longo.'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não conferem.',
  });

type FormValues = z.infer<typeof schema>;

type Params = {
  intent?: string;
  profile?: string;
  plan?: string;
  referral_code?: string;
  cupom?: string;
  ref?: string;
  listing_draft_id?: string;
  listing_draft_token?: string;
};

function normalizeCoupon(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function roleFromProfile(profile: string | undefined): string | undefined {
  if (profile === 'owner') return 'owner';
  if (profile === 'broker') return 'broker';
  if (profile === 'developer') return 'agency';
  return undefined;
}

function profileLabel(profile: string | undefined): string {
  if (profile === 'owner') return 'Proprietário direto';
  if (profile === 'broker') return 'Corretor ou imobiliária';
  if (profile === 'developer') return 'Incorporadora ou construtora';
  return 'Conta BSB Imóveis';
}

export default function RegisterScreen() {
  const params = useLocalSearchParams<Params>();
  const { registerAccount, socialLogin } = useAuth();
  const initialCoupon = normalizeCoupon(
    params.referral_code ?? params.cupom ?? params.ref ?? '',
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [documentVersion, setDocumentVersion] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      referralCode: initialCoupon,
    },
  });

  const selectedRole = roleFromProfile(params.profile);
  const target = useMemo(() => {
    if (params.intent === 'subscribe' && params.plan) {
      return { pathname: '/painel/assinatura' as const, params: { plan: params.plan } };
    }
    if (params.intent === 'publish') return '/painel/imoveis/novo' as const;
    return '/painel' as const;
  }, [params.intent, params.plan]);

  const navigateAfterRegistration = useCallback(() => {
    router.replace(target);
  }, [target]);

  const validateLegalAcceptance = useCallback((): documentVersion is number => {
    if (!termsAccepted || documentVersion === null) {
      setMessage('Leia e aceite a versão atual dos Termos de Uso para continuar.');
      return false;
    }
    return true;
  }, [documentVersion, termsAccepted]);

  const submit = handleSubmit(async (values) => {
    if (!validateLegalAcceptance()) return;
    setMessage(null);

    try {
      await registerAccount({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        terms_accepted: true,
        document_version: documentVersion,
        role: selectedRole,
        referral_code: normalizeCoupon(values.referralCode) || undefined,
        listing_draft_id: params.listing_draft_id || undefined,
        listing_draft_token: params.listing_draft_token || undefined,
      });
      navigateAfterRegistration();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível criar sua conta.'));
    }
  });

  async function registerWithGoogle() {
    if (!validateLegalAcceptance()) return;
    setIsGoogleSubmitting(true);
    setMessage(null);
    try {
      const token = await requestGoogleAccessToken();
      await socialLogin('google', token, {
        terms_accepted: true,
        document_version: documentVersion,
        role: selectedRole,
        referral_code: initialCoupon || undefined,
        listing_draft_id: params.listing_draft_id || undefined,
        listing_draft_token: params.listing_draft_token || undefined,
      });
      navigateAfterRegistration();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Não foi possível criar a conta com o Google.'));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <Screen>
      <PageHeader
        eyebrow={params.intent === 'publish' ? 'Anunciar imóvel' : 'Conta gratuita'}
        title={params.intent === 'publish' ? 'Crie sua conta antes do imóvel' : 'Crie sua conta'}
        description="Comece com os dados essenciais e complete seu perfil profissional depois."
      />

      {(params.profile || params.plan || initialCoupon) ? (
        <Card style={styles.contextCard}>
          {params.profile ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Perfil</Text>
              <Text style={styles.contextValue}>{profileLabel(params.profile)}</Text>
            </View>
          ) : null}
          {params.plan ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Plano selecionado</Text>
              <Text style={styles.contextValue}>Plano #{params.plan}</Text>
            </View>
          ) : null}
          {initialCoupon ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Cupom</Text>
              <Text style={styles.contextValue}>{initialCoupon}</Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.formCard}>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label="Nome"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              autoCapitalize="words"
              error={fieldState.error?.message}
            />
          )}
        />
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
              error={fieldState.error?.message}
              hint="Mínimo de 8 caracteres."
              textContentType="newPassword"
              autoComplete="new-password"
            />
          )}
        />
        <Controller
          control={control}
          name="passwordConfirmation"
          render={({ field, fieldState }) => (
            <PasswordField
              label="Confirmar senha"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              textContentType="newPassword"
              autoComplete="new-password"
            />
          )}
        />
        <Controller
          control={control}
          name="referralCode"
          render={({ field, fieldState }) => (
            <TextField
              label="Cupom de indicação (opcional)"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={(value) => field.onChange(normalizeCoupon(value))}
              autoCapitalize="characters"
              error={fieldState.error?.message}
            />
          )}
        />

        <TermsAgreement
          checked={termsAccepted}
          onChange={setTermsAccepted}
          onVersionChange={setDocumentVersion}
          error={message?.includes('Termos') ? message : undefined}
        />

        {message && !message.includes('Termos') ? <Text style={styles.error}>{message}</Text> : null}

        <Button
          label={isSubmitting ? 'Criando conta...' : 'Criar conta'}
          loading={isSubmitting}
          onPress={() => void submit()}
        />
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.divider} />
        </View>
        <Button
          label={isGoogleSubmitting ? 'Conectando ao Google...' : 'Continuar com Google'}
          variant="secondary"
          loading={isGoogleSubmitting}
          disabled={!isGoogleSignInConfigured()}
          onPress={() => void registerWithGoogle()}
        />
        {!isGoogleSignInConfigured() ? (
          <Text style={styles.googleHint}>Configure os Client IDs do Google no arquivo `.env`.</Text>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contextCard: { gap: spacing.sm, backgroundColor: colors.surfaceAlt },
  contextRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  contextLabel: { color: colors.textMuted, fontSize: 12 },
  contextValue: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  formCard: { gap: spacing.md },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 10, fontWeight: '900' },
  googleHint: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
