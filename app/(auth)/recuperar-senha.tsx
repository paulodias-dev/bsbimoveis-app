import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, spacing } from '@/theme/tokens';
import { getErrorMessage } from '@/utils/format';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async (values) => {
    setMessage(null);
    setSuccess(false);

    try {
      const response = await forgotPassword(values.email);
      setSuccess(true);
      setMessage(response.message || 'Enviamos as instruções para o seu e-mail.');
    } catch (error) {
      setMessage(
        getErrorMessage(error, 'Não foi possível enviar as instruções agora.'),
      );
    }
  });

  return (
    <Screen>
      <PageHeader
        eyebrow="Recuperação"
        title="Esqueceu sua senha?"
        description="Informe seu e-mail para receber as instruções de recuperação."
      />

      <Card>
        <View style={styles.form}>
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

          {message ? (
            <Text style={success ? styles.success : styles.error}>{message}</Text>
          ) : null}

          <Button
            label={isSubmitting ? 'Enviando...' : 'Enviar instruções'}
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
  success: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
