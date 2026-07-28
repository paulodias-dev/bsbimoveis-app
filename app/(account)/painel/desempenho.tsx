import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Property } from '@/types/api';
import { formatCurrency } from '@/utils/format';

function propertyPrice(property: Property): number | null {
  return property.price_sale ?? property.price_rent ?? property.price_seasonal_daily;
}

function photoCount(property: Property): number {
  return property.photos_count ?? property.photos?.length ?? 0;
}

function qualityScore(property: Property): number {
  let score = 0;
  if (property.title?.length >= 24) score += 16;
  if ((property.description?.length ?? 0) >= 140) score += 18;
  if (photoCount(property) >= 5) score += 24;
  if (property.cover_photo?.url) score += 14;
  if (property.latitude && property.longitude) score += 10;
  if (property.amenities?.length >= 3) score += 10;
  if (propertyPrice(property)) score += 8;
  return Math.min(score, 100);
}

function getMonthBuckets() {
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: formatter.format(date).replace('.', ''),
    };
  });
}

function percentage(value: number, maximum: number, minimum = 3): DimensionValue {
  const result = maximum > 0 ? Math.max(minimum, (value / maximum) * 100) : minimum;
  return `${Math.min(result, 100)}%`;
}

export default function PerformanceScreen() {
  const { properties, isLoading, hydrate } = usePainelStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const metrics = useMemo(() => {
    const totalViews = properties.reduce((sum, property) => sum + (property.views_count ?? 0), 0);
    const totalFavorites = properties.reduce(
      (sum, property) => sum + (property.favorites_count ?? 0),
      0,
    );
    const published = properties.filter(
      (property) => property.publication_status === 'approved' && (property.is_published ?? true),
    ).length;
    const paused = properties.filter(
      (property) => property.publication_status === 'paused' || property.is_published === false,
    ).length;
    const review = properties.filter(
      (property) => property.publication_status === 'pending_review',
    ).length;
    const other = Math.max(properties.length - published - paused - review, 0);
    const averageQuality = properties.length
      ? Math.round(
          properties.reduce((sum, property) => sum + qualityScore(property), 0) /
            properties.length,
        )
      : 0;
    const intentRate = totalViews > 0 ? Math.round((totalFavorites / totalViews) * 1000) / 10 : 0;
    return {
      totalViews,
      totalFavorites,
      published,
      paused,
      review,
      other,
      averageQuality,
      intentRate,
    };
  }, [properties]);

  const monthBuckets = useMemo(getMonthBuckets, []);
  const monthly = useMemo(
    () =>
      monthBuckets.map((bucket) => ({
        ...bucket,
        views: properties
          .filter((property) => (property.created_at ?? '').startsWith(bucket.key))
          .reduce((sum, property) => sum + (property.views_count ?? 0), 0),
        favorites: properties
          .filter((property) => (property.created_at ?? '').startsWith(bucket.key))
          .reduce((sum, property) => sum + (property.favorites_count ?? 0), 0),
      })),
    [monthBuckets, properties],
  );
  const monthlyMaximum = Math.max(
    ...monthly.flatMap((item) => [item.views, item.favorites]),
    1,
  );

  const top = useMemo(
    () =>
      [...properties]
        .sort((left, right) => (right.views_count ?? 0) - (left.views_count ?? 0))
        .slice(0, 8),
    [properties],
  );
  const topMaximum = Math.max(...top.map((property) => property.views_count ?? 0), 1);
  const totalStatuses = Math.max(properties.length, 1);

  if (isLoading && properties.length === 0) {
    return (
      <Screen>
        <StateView title="Carregando indicadores..." loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Business intelligence"
        title="Desempenho dos anúncios"
        description="Leia alcance, intenção, qualidade de cadastro e gargalos de publicação."
      />

      <View style={styles.metricsGrid}>
        <Metric label="Visualizações" value={String(metrics.totalViews)} description="Soma real da carteira." />
        <Metric label="Favoritos" value={String(metrics.totalFavorites)} description="Sinais de interesse." />
        <Metric label="Taxa de intenção" value={`${metrics.intentRate}%`} description="Favoritos sobre views." />
        <Metric label="Qualidade média" value={`${metrics.averageQuality}%`} description="Fotos, texto e localização." />
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Evolução de alcance e intenção</Text>
            <Text style={styles.sectionDescription}>Dados agrupados pelos imóveis criados nos últimos meses.</Text>
          </View>
          <View style={styles.periodBadge}><Text style={styles.periodText}>6 MESES</Text></View>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={styles.viewsDot} /><Text style={styles.legendText}>Visualizações</Text></View>
          <View style={styles.legendItem}><View style={styles.favoritesDot} /><Text style={styles.legendText}>Favoritos</Text></View>
        </View>
        <View style={styles.monthList}>
          {monthly.map((item) => (
            <View key={item.key} style={styles.monthRow}>
              <Text style={styles.monthLabel}>{item.label}</Text>
              <View style={styles.bars}>
                <View style={styles.track}>
                  <View style={[styles.viewsBar, { width: percentage(item.views, monthlyMaximum) }]} />
                </View>
                <View style={styles.track}>
                  <View style={[styles.favoritesBar, { width: percentage(item.favorites, monthlyMaximum) }]} />
                </View>
              </View>
              <Text style={styles.monthValue}>{item.views}/{item.favorites}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Mix de publicação</Text>
        <Text style={styles.sectionDescription}>Mostra onde a carteira está travada.</Text>
        <View style={styles.segmentedBar}>
          {metrics.published > 0 ? <View style={[styles.publishedSegment, { flex: metrics.published / totalStatuses }]} /> : null}
          {metrics.paused > 0 ? <View style={[styles.pausedSegment, { flex: metrics.paused / totalStatuses }]} /> : null}
          {metrics.review > 0 ? <View style={[styles.reviewSegment, { flex: metrics.review / totalStatuses }]} /> : null}
          {metrics.other > 0 ? <View style={[styles.otherSegment, { flex: metrics.other / totalStatuses }]} /> : null}
        </View>
        <View style={styles.statusGrid}>
          <Status label="Publicados" value={metrics.published} color="#039855" />
          <Status label="Ocultos" value={metrics.paused} color="#667085" />
          <Status label="Em revisão" value={metrics.review} color="#DC6803" />
          <Status label="Outros" value={metrics.other} color="#3157FF" />
        </View>
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Ranking por visualizações</Text>
        {top.length ? (
          <View style={styles.rankingList}>
            {top.map((property) => (
              <View key={property.id} style={styles.rankingItem}>
                <View style={styles.rankingHeader}>
                  <View style={styles.rankingCopy}>
                    <Text style={styles.rankingTitle} numberOfLines={2}>{property.title}</Text>
                    <Text style={styles.rankingMeta}>
                      {property.city ?? 'Cidade não informada'} · {formatCurrency(propertyPrice(property))}
                    </Text>
                  </View>
                  <Text style={styles.rankingValue}>{property.views_count ?? 0}</Text>
                </View>
                <View style={styles.rankingTrack}>
                  <View style={[styles.rankingBar, { width: percentage(property.views_count ?? 0, topMaximum, 8) }]} />
                </View>
                <Button
                  label="Editar anúncio"
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/painel/imoveis/[id]/editar', params: { id: String(property.id) } })}
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.sectionDescription}>Sem dados suficientes para análise.</Text>
        )}
      </Card>

      <Card style={styles.noticeCard}>
        <Text style={styles.sectionTitle}>Campanhas e cupons</Text>
        <Text style={styles.sectionDescription}>
          A API atual ainda não expõe métricas de campanhas patrocinadas. Esta tela não cria números simulados.
        </Text>
      </Card>
    </Screen>
  );
}

function Metric({ label, value, description }: { label: string; value: string; description: string }) {
  return <Card style={styles.metricCard}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricNumber}>{value}</Text><Text style={styles.metricDescription}>{description}</Text></Card>;
}

function Status({ label, value, color }: { label: string; value: number; color: string }) {
  return <View style={styles.statusItem}><View style={[styles.statusDot, { backgroundColor: color }]} /><View><Text style={styles.statusValue}>{value}</Text><Text style={styles.statusLabel}>{label}</Text></View></View>;
}

const styles = StyleSheet.create({
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '48%', gap: spacing.xs },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  metricNumber: { color: colors.text, fontSize: 23, fontWeight: '900' },
  metricDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  chartCard: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  sectionCopy: { flex: 1, gap: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  sectionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  periodBadge: { borderRadius: radius.pill, backgroundColor: colors.brandSoft, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  periodText: { color: colors.brandDark, fontSize: 9, fontWeight: '900' },
  legend: { flexDirection: 'row', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  viewsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  favoritesDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  legendText: { color: colors.textMuted, fontSize: 11 },
  monthList: { gap: spacing.sm },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthLabel: { width: 28, color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  bars: { flex: 1, gap: 4 },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  viewsBar: { height: 7, borderRadius: radius.pill, backgroundColor: colors.brand },
  favoritesBar: { height: 7, borderRadius: radius.pill, backgroundColor: colors.success },
  monthValue: { width: 48, color: colors.textMuted, fontSize: 10, textAlign: 'right' },
  segmentedBar: { height: 16, borderRadius: radius.pill, flexDirection: 'row', overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  publishedSegment: { backgroundColor: '#039855' },
  pausedSegment: { backgroundColor: '#667085' },
  reviewSegment: { backgroundColor: '#DC6803' },
  otherSegment: { backgroundColor: '#3157FF' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusItem: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, padding: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  statusLabel: { color: colors.textMuted, fontSize: 10 },
  rankingList: { gap: spacing.md },
  rankingItem: { borderRadius: radius.md, backgroundColor: colors.surfaceAlt, padding: spacing.md, gap: spacing.sm },
  rankingHeader: { flexDirection: 'row', gap: spacing.sm },
  rankingCopy: { flex: 1, gap: spacing.xs },
  rankingTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  rankingMeta: { color: colors.textMuted, fontSize: 10 },
  rankingValue: { color: colors.brand, fontSize: 17, fontWeight: '900' },
  rankingTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.white, overflow: 'hidden' },
  rankingBar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.brand },
  noticeCard: { gap: spacing.sm, backgroundColor: colors.surfaceAlt },
});
