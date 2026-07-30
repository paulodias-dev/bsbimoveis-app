import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordField } from '@/components/ui/PasswordField';
import { Screen } from '@/components/ui/Screen';
import { getBiometricLoginLabel } from '@/features/auth/biometricAuth';
import { useAuth } from '@/features/auth/AuthProvider';
import { updatePassword } from '@/features/profile/profileService';
import { colors, spacing } from '@/theme/tokens';

const passwordSchema = z
  .object({
    current_password: z.string().min(6, 'Informe sua senha atual.'),
    password: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
    password_confirmation: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ['password_confirmation'],
    message: 'As senhas não conferem.',
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;
type Feedback = { message: string; tone: 'success' | 'error' };

export default function SecurityScreen() {
  const {
    biometricLoginAvailable,
    biometricLoginEnabled,
    biometricLoginEmail,
    disableBiometricLogin,
  } = useAuth();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const biometricLabel = getBiometricLoginLabel();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  const submit = handleSubmit(async (values) => {
    setFeedback(null);
    try {
      const response = await updatePassword(values);
      if (biometricLoginEnabled) {
        await disableBiometricLogin();
      }
      reset();
      setFeedback({
        message:
          response.message ??
          (biometricLoginEnabled
            ? 'Senha alterada com sucesso. O acesso biométrico foi removido e pode ser configurado novamente no próximo login.'
            : 'Senha alterada com sucesso.'),
        tone: 'success',
      });
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível alterar a senha.',
        tone: 'error',
      });
    }
  });

  return (
    <Screen>
      <PageHeader
        eyebrow="Conta"
        title="Segurança"
        description="Atualize sua senha mantendo o acesso ao painel protegido."
      />

      {feedback ? (
        <Card style={feedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess}>
          <Text style={feedback.tone === 'error' ? styles.errorText : styles.successText}>
            {feedback.message}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.title}>Acesso biométrico</Text>
        <Text style={styles.description}>
          {biometricLoginEnabled
            ? `Seu aparelho possui um acesso salvo com ${biometricLabel} para ${biometricLoginEmail}.`
            : biometricLoginAvailable
              ? `Você ainda não ativou o acesso com ${biometricLabel}. Ele pode ser habilitado ao entrar com e-mail e senha.`
              : 'A biometria não está disponível neste ambiente ou neste aparelho.'}
        </Text>
        {biometricLoginEnabled ? (
          <Button
            label="Remover acesso biométrico"
            variant="secondary"
            onPress={() => void disableBiometricLogin()}
          />
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Alterar senha</Text>
        <Text style={styles.description}>
          Use uma senha exclusiva. Os campos ficam ocultos por padrão e podem ser visualizados individualmente.
        </Text>
        <Controller
          control={control}
          name="current_password"
          render={({ field, fieldState }) => (
            <PasswordField
              label="Senha atual"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              textContentType="password"
              autoComplete="current-password"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordField
              label="Nova senha"
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
          name="password_confirmation"
          render={({ field, fieldState }) => (
            <PasswordField
              label="Confirmar nova senha"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              textContentType="newPassword"
              autoComplete="new-password"
            />
          )}
        />
        <Button
          label={isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
          loading={isSubmitting}
          onPress={() => void submit()}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feedbackSuccess: { borderColor: '#6CE9A6', backgroundColor: '#ECFDF3' },
  successText: { color: '#027A48', fontSize: 13, fontWeight: '700' },
  feedbackError: { borderColor: '#FDA29B', backgroundColor: '#FEF3F2' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  card: { gap: spacing.md },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
