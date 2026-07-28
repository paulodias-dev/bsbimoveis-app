import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Plan } from '@/types/api';
import { formatCurrency } from '@/utils/format';

interface PlanSelectorProps {
  plans: Plan[];
  selectedPlanId: number | null;
  currentPlanId: number | null;
  onSelect: (planId: number) => void;
}

function billingLabel(days: number): string {
  if (days >= 360) return '/ano';
  if (days >= 180) return '/semestre';
  if (days >= 84) return '/trimestre';
  if (days >= 28 && days <= 31) return '/mês';
  return `/${days} dias`;
}

export function PlanSelector({
  plans,
  selectedPlanId,
  currentPlanId,
  onSelect,
}: PlanSelectorProps) {
  return (
    <View style={styles.list}>
      {plans.map((plan) => {
        const selected = plan.id === selectedPlanId;
        const current = plan.id === currentPlanId;
        return (
          <Pressable
            key={plan.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onSelect(plan.id)}
          >
            <Card style={[styles.card, selected && styles.cardSelected]}>
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <View style={styles.badges}>
                    {current ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>PLANO ATUAL</Text>
                      </View>
                    ) : null}
                    {plan.is_recommended ? (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>RECOMENDADO</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.name}>{plan.name}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  <Text style={styles.radioText}>{selected ? '✓' : ''}</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{plan.price <= 0 ? 'Grátis' : formatCurrency(plan.price)}</Text>
                <Text style={styles.period}>{billingLabel(plan.duration_days)}</Text>
              </View>

              <View style={styles.features}>
                <Text style={styles.feature}>{plan.limit_properties} imóveis ativos</Text>
                <Text style={styles.feature}>{plan.max_photos_per_property} fotos por anúncio</Text>
                <Text style={styles.feature}>{plan.duration_days} dias de validade</Text>
                <Text style={styles.feature}>
                  {plan.has_featured ? 'Destaque incluído' : 'Sem destaque no portal'}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  cardSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerCopy: { flex: 1, gap: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  currentBadge: {
    borderRadius: radius.pill,
    backgroundColor: '#D1FADF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  currentBadgeText: { color: '#027A48', fontSize: 9, fontWeight: '900' },
  recommendedBadge: {
    borderRadius: radius.pill,
    backgroundColor: '#FEF0C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  recommendedBadgeText: { color: '#B54708', fontSize: 9, fontWeight: '900' },
  name: { color: colors.text, fontSize: 19, fontWeight: '900' },
  radio: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.brand, backgroundColor: colors.brand },
  radioText: { color: colors.white, fontWeight: '900' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  price: { color: colors.brandDark, fontSize: 25, fontWeight: '900' },
  period: { color: colors.textMuted, fontSize: 12 },
  features: { gap: spacing.xs },
  feature: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});
