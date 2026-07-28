import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { colors, radius, spacing } from '@/theme/tokens';
import type { AuthUser, Plan } from '@/types/api';
import { generatePixPayment, type PaymentResponse } from './subscriptionService';

const payerSchema = z.object({
  payer_name: z.string().trim().min(2, 'Informe o nome do pagador.'),
  payer_email: z.string().trim().email('Informe um e-mail válido.'),
  identification_type: z.enum(['CPF', 'CNPJ']),
  identification_number: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length === 11 || value.length === 14, {
      message: 'Informe um CPF ou CNPJ válido.',
    }),
});

type PayerFormValues = z.input<typeof payerSchema>;

interface PixCheckoutFormProps {
  plan: Plan;
  user: AuthUser;
  onGenerated: (payment: PaymentResponse) => void;
  onFeedback: (message: string, tone: 'success' | 'error') => void;
}

export function PixCheckoutForm({
  plan,
  user,
  onGenerated,
  onFeedback,
}: PixCheckoutFormProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PayerFormValues>({
    resolver: zodResolver(payerSchema),
    defaultValues: {
      payer_name: user.name,
      payer_email: user.email,
      identification_type: 'CPF',
      identification_number: '',
    },
  });

  const submit = handleSubmit(async (rawValues) => {
    const values = payerSchema.parse(rawValues);
    try {
      const payment = await generatePixPayment({
        plan_id: plan.id,
        payer_name: values.payer_name,
        payer_email: values.payer_email,
        identification_type: values.identification_type,
        identification_number: values.identification_number,
      });
      onGenerated(payment);
      onFeedback('PIX gerado. Conclua o pagamento no aplicativo do seu banco.', 'success');
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Não foi possível gerar o pagamento PIX.',
        'error',
      );
    }
  });

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Dados do pagador</Text>
          <Text style={styles.description}>O documento é exigido pelo processador do pagamento.</Text>
        </View>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{plan.name}</Text>
        </View>
      </View>

      <Controller
        control={control}
        name="payer_name"
        render={({ field, fieldState }) => (
          <TextField
            label="Nome do pagador"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            autoCapitalize="words"
          />
        )}
      />
      <Controller
        control={control}
        name="payer_email"
        render={({ field, fieldState }) => (
          <TextField
            label="E-mail do pagador"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      <Controller
        control={control}
        name="identification_type"
        render={({ field }) => (
          <View style={styles.documentType}>
            {(['CPF', 'CNPJ'] as const).map((type) => {
              const selected = field.value === type;
              return (
                <Pressable
                  key={type}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => field.onChange(type)}
                  style={[styles.documentOption, selected && styles.documentOptionSelected]}
                >
                  <Text
                    style={[
                      styles.documentOptionText,
                      selected && styles.documentOptionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />
      <Controller
        control={control}
        name="identification_number"
        render={({ field, fieldState }) => (
          <TextField
            label="CPF ou CNPJ"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            keyboardType="numeric"
          />
        )}
      />
      <Button
        label={isSubmitting ? 'Gerando PIX...' : 'Gerar pagamento PIX'}
        loading={isSubmitting}
        onPress={() => void submit()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: 17, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  planBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  planBadgeText: { color: colors.brandDark, fontSize: 11, fontWeight: '900' },
  documentType: { flexDirection: 'row', gap: spacing.sm },
  documentOption: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    alignItems: 'center',
  },
  documentOptionSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  documentOptionText: { color: colors.textMuted, fontWeight: '800' },
  documentOptionTextSelected: { color: colors.brandDark },
});
