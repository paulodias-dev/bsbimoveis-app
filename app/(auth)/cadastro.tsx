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
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';
import { getErrorMessage } from '@/utils/format';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.'),
    email: z.string().email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não conferem.',
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { registerAccount } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    },
  });

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

  return (
    <Screen>
      <PageHeader
        eyebrow="Conta gratuita"
        title="Crie sua conta"
        description="Comece com os dados essenciais e complete seu perfil depois."
      />

      <Card>
        <View style={styles.form}>
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
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="passwordConfirmation"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Confirmar senha"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
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
});
