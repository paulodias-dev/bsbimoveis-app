import { Link } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, radius, spacing } from '@/theme/tokens';

export default function DashboardScreen() {
  const { user } = useAuth();
  const {
    hydrate,
    isLoading,
    error,
    properties,
    favorites,
    subscription,
  } = usePainelStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const metrics = useMemo(() => {
    const published = properties.filter(
      (property) =>
        property.publication_status === 'approved' && property.is_published,
    ).length;
    const pending = properties.filter(
      (property) => property.publication_status === 'pending_review',
    ).length;
    const views = properties.reduce(
      (total, property) => total + (property.views_count ?? 0),
      0,
    );

    return [
      ['Imóveis', properties.length],
      ['Publicados', published],
      ['Em revisão', pending],
      ['Visualizações', views],
    ] as const;
  }, [properties]);

  if (isLoading && properties.length === 0) {
    return (
      <Screen>
        <StateView title="Carregando seu painel..." loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Painel inteligente"
        title={`Olá, ${user?.name.split(/\s+/)[0] || 'cliente'}.`}
        description="Acompanhe sua carteira e continue a gestão dos anúncios pelo aplicativo."
      />

      {error ? (
        <Card>
          <StateView
            title="Alguns dados não foram carregados"
            description={error}
            actionLabel="Tentar novamente"
            onAction={() => void hydrate(true)}
          />
        </Card>
      ) : null}

      <View style={styles.metrics}>
        {metrics.map(([label, value]) => (
          <Card key={label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value.toLocaleString('pt-BR')}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text style={styles.cardEyebrow}>Assinatura</Text>
        <Text style={styles.cardTitle}>
          {subscription?.plan?.name ?? 'Sem assinatura ativa'}
        </Text>
        <Text style={styles.cardDescription}>
          {subscription?.remaining_slots ?? 0} vaga(s) disponível(is) para novos anúncios.
        </Text>
        <View style={styles.cardAction}>
          <Link href="/painel/assinatura" asChild>
            <Button label="Gerenciar assinatura" variant="secondary" />
          </Link>
        </View>
      </Card>

      <View style={styles.actions}>
        <Link href="/painel/imoveis/novo" asChild>
          <Button label="Cadastrar imóvel" />
        </Link>
        <Link href="/painel/imoveis" asChild>
          <Button label="Gerenciar imóveis" variant="secondary" />
        </Link>
        <Link href="/painel/desempenho" asChild>
          <Button label="Ver desempenho" variant="secondary" />
        </Link>
        <Link href="/painel/favoritos" asChild>
          <Button
            label={`Favoritos (${favorites.length})`}
            variant="secondary"
          />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    minHeight: 108,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
  },
  cardEyebrow: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  cardAction: {
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
    borderRadius: radius.md,
  },
});
