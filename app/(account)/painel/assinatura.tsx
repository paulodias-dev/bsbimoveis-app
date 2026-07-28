import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';
import { PixCheckoutForm } from '@/features/subscription/PixCheckoutForm';
import { PixPaymentResult } from '@/features/subscription/PixPaymentResult';
import { PlanSelector } from '@/features/subscription/PlanSelector';
import {
  getPlans,
  getSubscription,
  type PaymentResponse,
} from '@/features/subscription/subscriptionService';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';

type Feedback = { message: string; tone: 'success' | 'error' };

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Não definida';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));
}

export default function SubscriptionScreen() {
  const params = useLocalSearchParams<{ plan?: string }>();
  const requestedPlanId = Number(params.plan) || null;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(requestedPlanId);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
  });
  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
  });

  const plans = useMemo(
    () =>
      [...(plansQuery.data?.data ?? [])]
        .filter((plan) => plan.is_active || plan.is_default || plan.is_free)
        .sort((left, right) => left.price - right.price),
    [plansQuery.data?.data],
  );
  const subscription = subscriptionQuery.data?.data ?? null;

  useEffect(() => {
    if (plans.length === 0) return;

    if (requestedPlanId && plans.some((plan) => plan.id === requestedPlanId)) {
      if (selectedPlanId !== requestedPlanId) {
        setSelectedPlanId(requestedPlanId);
        setPayment(null);
      }
      return;
    }

    if (selectedPlanId) return;
    const initial =
      plans.find((plan) => plan.id === subscription?.plan?.id) ??
      plans.find((plan) => plan.is_recommended) ??
      plans.find((plan) => plan.is_default) ??
      plans[0];
    setSelectedPlanId(initial?.id ?? null);
  }, [plans, requestedPlanId, selectedPlanId, subscription?.plan?.id]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  function handleFeedback(message: string, tone: 'success' | 'error') {
    setFeedback({ message, tone });
  }

  async function refresh() {
    setFeedback(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['subscription'] }),
      queryClient.invalidateQueries({ queryKey: ['plans'] }),
      usePainelStore.getState().hydrate(),
    ]);
    setFeedback({ message: 'Assinatura e planos atualizados.', tone: 'success' });
  }

  if (subscriptionQuery.isLoading || plansQuery.isLoading) {
    return (
      <Screen>
        <StateView title="Carregando assinatura e planos..." loading />
      </Screen>
    );
  }

  const error = subscriptionQuery.error ?? plansQuery.error;
  if (error) {
    return (
      <Screen>
        <StateView
          title="Não foi possível carregar os planos"
          description={error.message}
          actionLabel="Tentar novamente"
          onAction={() => void refresh()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Operação"
        title="Assinatura e planos"
        description="Controle seu plano, vagas disponíveis e pagamento PIX."
      />

      {feedback ? (
        <Card style={feedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess}>
          <Text style={feedback.tone === 'error' ? styles.errorText : styles.successText}>
            {feedback.message}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.currentCard}>
        <View style={styles.currentHeader}>
          <View style={styles.currentHeaderCopy}>
            <Text style={styles.kicker}>PLANO VIGENTE</Text>
            <Text style={styles.currentName}>{subscription?.plan?.name ?? 'Sem assinatura ativa'}</Text>
          </View>
          <View style={subscription?.is_active ? styles.activeBadge : styles.inactiveBadge}>
            <Text style={subscription?.is_active ? styles.activeText : styles.inactiveText}>
              {subscription?.is_active ? 'ATIVA' : 'INATIVA'}
            </Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{subscription?.remaining_slots ?? 0}</Text>
            <Text style={styles.metricLabel}>vagas livres</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatDate(subscription?.expires_at)}</Text>
            <Text style={styles.metricLabel}>validade</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {subscription?.plan ? formatCurrency(subscription.plan.price) : '—'}
            </Text>
            <Text style={styles.metricLabel}>valor do plano</Text>
          </View>
        </View>
        <Button label="Atualizar assinatura" variant="secondary" onPress={() => void refresh()} />
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Escolha o plano</Text>
          <Text style={styles.sectionDescription}>
            Selecione uma opção para gerar o pagamento correspondente.
          </Text>
        </View>
        <PlanSelector
          plans={plans}
          selectedPlanId={selectedPlanId}
          currentPlanId={subscription?.plan?.id ?? null}
          onSelect={(planId) => {
            setSelectedPlanId(planId);
            setPayment(null);
            setFeedback(null);
          }}
        />
      </View>

      {selectedPlan && user ? (
        <PixCheckoutForm
          key={selectedPlan.id}
          plan={selectedPlan}
          user={user}
          onGenerated={setPayment}
          onFeedback={handleFeedback}
        />
      ) : null}

      {payment ? <PixPaymentResult payment={payment} onFeedback={handleFeedback} /> : null}

      <Card style={styles.cardNotice}>
        <Text style={styles.cardNoticeTitle}>Pagamento com cartão</Text>
        <Text style={styles.cardNoticeText}>
          A interface está reservada para a ponte nativa do Mercado Pago. Dados de cartão não serão coletados em WebView nem enviados diretamente pela aplicação.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feedbackSuccess: { borderColor: '#6CE9A6', backgroundColor: '#ECFDF3' },
  successText: { color: '#027A48', fontSize: 13, fontWeight: '700' },
  feedbackError: { borderColor: '#FDA29B', backgroundColor: '#FEF3F2' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  currentCard: { gap: spacing.md },
  currentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  currentHeaderCopy: { flex: 1, gap: spacing.xs },
  kicker: { color: colors.brand, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  currentName: { color: colors.text, fontSize: 21, fontWeight: '900' },
  activeBadge: {
    borderRadius: radius.pill,
    backgroundColor: '#D1FADF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  inactiveBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  activeText: { color: '#027A48', fontSize: 10, fontWeight: '900' },
  inactiveText: { color: colors.textMuted, fontSize: 10, fontWeight: '900' },
  metrics: { gap: spacing.sm },
  metric: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontSize: 11 },
  section: { gap: spacing.md },
  sectionHeader: { gap: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sectionDescription: { color: colors.textMuted, fontSize: 13 },
  cardNotice: { gap: spacing.sm, backgroundColor: colors.surfaceAlt },
  cardNoticeTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  cardNoticeText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
