import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';
import { PlanSelector } from '@/features/subscription/PlanSelector';
import { getPlans } from '@/features/subscription/subscriptionService';
import { colors, spacing } from '@/theme/tokens';

export default function PlansScreen() {
  const { isAuthenticated } = useAuth();
  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: getPlans });
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const plans = useMemo(
    () =>
      [...(plansQuery.data?.data ?? [])]
        .filter((plan) => plan.is_active || plan.is_default || plan.is_free)
        .sort((left, right) => left.price - right.price),
    [plansQuery.data?.data],
  );

  useEffect(() => {
    if (selectedPlanId || plans.length === 0) return;
    const recommended =
      plans.find((plan) => plan.is_recommended) ??
      plans.find((plan) => plan.is_default) ??
      plans[0];
    setSelectedPlanId(recommended?.id ?? null);
  }, [plans, selectedPlanId]);

  if (plansQuery.isLoading) {
    return (
      <Screen>
        <StateView title="Carregando planos..." loading />
      </Screen>
    );
  }

  if (plansQuery.error) {
    return (
      <Screen>
        <StateView
          title="Não foi possível carregar os planos"
          description={plansQuery.error.message}
          actionLabel="Tentar novamente"
          onAction={() => void plansQuery.refetch()}
        />
      </Screen>
    );
  }

  function continueToPlan() {
    if (!selectedPlanId) return;
    if (isAuthenticated) {
      router.push({ pathname: '/painel/assinatura', params: { plan: String(selectedPlanId) } });
      return;
    }
    router.push({
      pathname: '/cadastro',
      params: { intent: 'subscribe', plan: String(selectedPlanId) },
    });
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Planos"
        title="Qual plano combina com você?"
        description="Compare limites, fotos, validade e destaque antes de assinar."
      />

      <Card style={styles.guide}>
        <Text style={styles.guideTitle}>Escolha com tranquilidade</Text>
        <Text style={styles.guideText}>
          A assinatura é concluída dentro do painel. O pagamento PIX usa o processador já integrado ao portal.
        </Text>
      </Card>

      <PlanSelector
        plans={plans}
        selectedPlanId={selectedPlanId}
        currentPlanId={null}
        onSelect={setSelectedPlanId}
      />

      <View style={styles.actions}>
        <Button
          label={isAuthenticated ? 'Continuar no painel' : 'Criar conta e assinar'}
          disabled={!selectedPlanId}
          onPress={continueToPlan}
        />
        {!isAuthenticated ? (
          <Button label="Já tenho conta" variant="secondary" onPress={() => router.push('/entrar')} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guide: { gap: spacing.sm, backgroundColor: colors.surfaceAlt },
  guideTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  guideText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  actions: { gap: spacing.md },
});
