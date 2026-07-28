import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Property } from '@/types/api';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel(): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function propertyStatus(property: Property): { label: string; tone: 'success' | 'warning' | 'muted' } {
  if (property.publication_status === 'pending_review') {
    return { label: 'Em revisão', tone: 'warning' };
  }
  if (property.publication_status === 'approved' && property.is_published) {
    return { label: 'Publicado', tone: 'success' };
  }
  return { label: 'Rascunho', tone: 'muted' };
}

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await hydrate(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [hydrate]);

  const summary = useMemo(() => {
    const published = properties.filter(
      (property) => property.publication_status === 'approved' && property.is_published,
    ).length;
    const pending = properties.filter(
      (property) => property.publication_status === 'pending_review',
    ).length;
    const drafts = properties.filter(
      (property) =>
        property.publication_status === 'draft' ||
        (!property.is_published && property.publication_status !== 'pending_review'),
    ).length;
    const views = properties.reduce(
      (total, property) => total + (property.views_count ?? 0),
      0,
    );
    const favoriteSignals = properties.reduce(
      (total, property) => total + (property.favorites_count ?? 0),
      0,
    );
    const incomplete = properties.filter(
      (property) =>
        (property.photos_count ?? property.photos?.length ?? 0) < 3 ||
        !property.latitude ||
        !property.longitude,
    ).length;

    return { published, pending, drafts, views, favoriteSignals, incomplete };
  }, [properties]);

  const recentProperties = useMemo(
    () =>
      [...properties]
        .sort((left, right) => {
          const leftDate = Date.parse(left.updated_at ?? left.created_at ?? '') || 0;
          const rightDate = Date.parse(right.updated_at ?? right.created_at ?? '') || 0;
          return rightDate - leftDate;
        })
        .slice(0, 3),
    [properties],
  );

  const planLimit = subscription?.plan?.limit_properties ?? 0;
  const usedSlots = properties.length;
  const usagePercentage = planLimit > 0 ? Math.min((usedSlots / planLimit) * 100, 100) : 0;
  const firstName = user?.name.split(/\s+/)[0] || 'cliente';

  if (isLoading && properties.length === 0) {
    return (
      <Screen>
        <StateView title="Preparando seu painel..." loading />
      </Screen>
    );
  }

  return (
    <Screen
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        ),
      }}
    >
      <GlassCard style={styles.heroCard} intensity={66}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTopline}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>OPERAÇÃO ATIVA</Text>
          </View>
          <Text style={styles.today}>{todayLabel()}</Text>
        </View>
        <Text style={styles.greeting}>{greeting()}, {firstName}.</Text>
        <Text style={styles.heroDescription}>
          Sua carteira está sincronizada. Veja o que exige atenção e continue a gestão sem sair do aplicativo.
        </Text>
        <View style={styles.heroHighlights}>
          <View style={styles.heroHighlight}>
            <Text style={styles.heroHighlightValue}>{summary.pending}</Text>
            <Text style={styles.heroHighlightLabel}>em revisão</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroHighlight}>
            <Text style={styles.heroHighlightValue}>{subscription?.remaining_slots ?? 0}</Text>
            <Text style={styles.heroHighlightLabel}>vagas livres</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroHighlight}>
            <Text style={styles.heroHighlightValue}>{summary.favoriteSignals}</Text>
            <Text style={styles.heroHighlightLabel}>interesses</Text>
          </View>
        </View>
      </GlassCard>

      {error ? (
        <GlassCard style={styles.errorCard}>
          <View style={styles.errorRow}>
            <View style={styles.errorIcon}>
              <Ionicons name="cloud-offline-outline" size={21} color={colors.danger} />
            </View>
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Sincronização parcial</Text>
              <Text style={styles.errorDescription}>{error}</Text>
            </View>
          </View>
          <Button label="Tentar novamente" variant="secondary" onPress={() => void refresh()} />
        </GlassCard>
      ) : null}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>VISÃO GERAL</Text>
          <Text style={styles.sectionTitle}>Sua operação hoje</Text>
        </View>
        <Pressable onPress={() => router.push('/painel/desempenho')} style={styles.sectionLink}>
          <Text style={styles.sectionLinkText}>Detalhes</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.brand} />
        </Pressable>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon="business-outline"
          label="Imóveis"
          value={properties.length}
          caption={`${summary.drafts} rascunho(s)`}
          accent="#3157FF"
        />
        <MetricCard
          icon="checkmark-circle-outline"
          label="Publicados"
          value={summary.published}
          caption="Na vitrine agora"
          accent="#039855"
        />
        <MetricCard
          icon="eye-outline"
          label="Visualizações"
          value={summary.views}
          caption="Alcance acumulado"
          accent="#7A5AF8"
        />
        <MetricCard
          icon="heart-outline"
          label="Favoritos"
          value={favorites.length}
          caption={`${summary.favoriteSignals} sinais recebidos`}
          accent="#E31B54"
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>ATALHOS</Text>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <QuickAction
          icon="add-circle"
          title="Novo imóvel"
          description="Inicie um anúncio"
          onPress={() => router.push('/painel/imoveis/novo')}
          primary
        />
        <QuickAction
          icon="business-outline"
          title="Minha carteira"
          description="Edite e publique"
          onPress={() => router.push('/painel/imoveis')}
        />
        <QuickAction
          icon="stats-chart-outline"
          title="Desempenho"
          description="Analise resultados"
          onPress={() => router.push('/painel/desempenho')}
        />
        <QuickAction
          icon="chatbubble-ellipses-outline"
          title="Oportunidades"
          description="Veja prioridades"
          onPress={() => router.push('/painel/mensagens')}
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>ASSINATURA</Text>
          <Text style={styles.sectionTitle}>Capacidade da conta</Text>
        </View>
        <View style={styles.planBadge}>
          <Ionicons name="diamond-outline" size={13} color={colors.brandDark} />
          <Text style={styles.planBadgeText}>{subscription?.plan?.name ?? 'Sem plano'}</Text>
        </View>
      </View>

      <GlassCard style={styles.planCard}>
        <View style={styles.planTopline}>
          <View style={styles.planIcon}>
            <Ionicons name="layers-outline" size={24} color={colors.brand} />
          </View>
          <View style={styles.planCopy}>
            <Text style={styles.planTitle}>Uso do plano</Text>
            <Text style={styles.planDescription}>
              {usedSlots} de {planLimit || '∞'} anúncio(s) utilizado(s)
            </Text>
          </View>
          <Text style={styles.planPercentage}>{Math.round(usagePercentage)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${usagePercentage}%` }]} />
        </View>
        <View style={styles.planFooter}>
          <View>
            <Text style={styles.planSlots}>{subscription?.remaining_slots ?? 0} vaga(s) disponível(is)</Text>
            <Text style={styles.planHint}>Amplie o plano quando sua carteira crescer.</Text>
          </View>
          <Pressable
            onPress={() => router.push('/painel/assinatura')}
            style={({ pressed }) => [styles.managePlanButton, pressed && styles.pressed]}
          >
            <Text style={styles.managePlanText}>Gerenciar</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.brandDark} />
          </Pressable>
        </View>
      </GlassCard>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>PRIORIDADES</Text>
          <Text style={styles.sectionTitle}>O que merece atenção</Text>
        </View>
      </View>

      <GlassCard contentStyle={styles.attentionContent}>
        <AttentionItem
          icon="time-outline"
          title="Anúncios em revisão"
          description={summary.pending ? `${summary.pending} aguardando aprovação.` : 'Nenhum anúncio aguardando aprovação.'}
          tone={summary.pending ? 'warning' : 'success'}
          onPress={() => router.push('/painel/imoveis')}
        />
        <View style={styles.attentionDivider} />
        <AttentionItem
          icon="images-outline"
          title="Qualidade do cadastro"
          description={summary.incomplete ? `${summary.incomplete} anúncio(s) podem receber mais fotos ou localização.` : 'Sua carteira está bem preenchida.'}
          tone={summary.incomplete ? 'warning' : 'success'}
          onPress={() => router.push('/painel/desempenho')}
        />
        <View style={styles.attentionDivider} />
        <AttentionItem
          icon="gift-outline"
          title="Indique e ganhe"
          description="Compartilhe seu cupom e acompanhe recompensas."
          tone="brand"
          onPress={() => router.push('/painel/indique-ganhe')}
        />
      </GlassCard>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>ATIVIDADE</Text>
          <Text style={styles.sectionTitle}>Imóveis atualizados</Text>
        </View>
        <Pressable onPress={() => router.push('/painel/imoveis')} style={styles.sectionLink}>
          <Text style={styles.sectionLinkText}>Ver todos</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.brand} />
        </Pressable>
      </View>

      {recentProperties.length ? (
        <View style={styles.recentList}>
          {recentProperties.map((property) => (
            <RecentProperty key={property.id} property={property} />
          ))}
        </View>
      ) : (
        <GlassCard contentStyle={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="home-outline" size={30} color={colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>Sua carteira começa aqui</Text>
          <Text style={styles.emptyDescription}>
            Cadastre o primeiro imóvel e acompanhe publicação, visualizações e favoritos pelo aplicativo.
          </Text>
          <Button label="Cadastrar primeiro imóvel" onPress={() => router.push('/painel/imoveis/novo')} />
        </GlassCard>
      )}
    </Screen>
  );
}

function MetricCard({
  icon,
  label,
  value,
  caption,
  accent,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  caption: string;
  accent: string;
}) {
  return (
    <GlassCard style={styles.metricCard} padding={spacing.md} intensity={38}>
      <View style={styles.metricTopline}>
        <View style={[styles.metricIcon, { backgroundColor: `${accent}18` }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <Ionicons name="trending-up" size={15} color="#98A2B3" />
      </View>
      <Text style={styles.metricValue}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
    </GlassCard>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
  primary = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, primary && styles.quickActionPrimary, pressed && styles.pressed]}
    >
      <View style={[styles.quickIcon, primary && styles.quickIconPrimary]}>
        <Ionicons name={icon} size={23} color={primary ? colors.white : colors.brand} />
      </View>
      <Text style={[styles.quickTitle, primary && styles.quickTitlePrimary]}>{title}</Text>
      <Text style={[styles.quickDescription, primary && styles.quickDescriptionPrimary]}>{description}</Text>
      <Ionicons
        name="arrow-forward-circle-outline"
        size={20}
        color={primary ? 'rgba(255,255,255,0.84)' : colors.brand}
        style={styles.quickArrow}
      />
    </Pressable>
  );
}

function AttentionItem({
  icon,
  title,
  description,
  tone,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  tone: 'success' | 'warning' | 'brand';
  onPress: () => void;
}) {
  const toneColor = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.brand;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.attentionItem, pressed && styles.pressed]}>
      <View style={[styles.attentionIcon, { backgroundColor: `${toneColor}14` }]}>
        <Ionicons name={icon} size={21} color={toneColor} />
      </View>
      <View style={styles.attentionCopy}>
        <Text style={styles.attentionTitle}>{title}</Text>
        <Text style={styles.attentionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#98A2B3" />
    </Pressable>
  );
}

function RecentProperty({ property }: { property: Property }) {
  const status = propertyStatus(property);
  const cover = property.cover_photo?.url ?? property.photos?.[0]?.url;
  const toneStyle =
    status.tone === 'success'
      ? styles.statusSuccess
      : status.tone === 'warning'
        ? styles.statusWarning
        : styles.statusMuted;
  const toneText =
    status.tone === 'success'
      ? styles.statusSuccessText
      : status.tone === 'warning'
        ? styles.statusWarningText
        : styles.statusMutedText;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/painel/imoveis/[id]/editar',
          params: { id: String(property.id) },
        })
      }
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <GlassCard padding={spacing.sm} intensity={36}>
        <View style={styles.recentRow}>
          <View style={styles.propertyImageShell}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.propertyImage} />
            ) : (
              <Ionicons name="image-outline" size={26} color="#98A2B3" />
            )}
          </View>
          <View style={styles.propertyCopy}>
            <View style={styles.propertyTopline}>
              <View style={[styles.statusBadge, toneStyle]}>
                <Text style={[styles.statusText, toneText]}>{status.label}</Text>
              </View>
              <Text style={styles.propertyId}>#{property.id}</Text>
            </View>
            <Text style={styles.propertyTitle} numberOfLines={2}>{property.title}</Text>
            <Text style={styles.propertyLocation} numberOfLines={1}>
              {[property.neighborhood, property.city].filter(Boolean).join(' · ') || 'Localização não informada'}
            </Text>
            <View style={styles.propertyStats}>
              <View style={styles.propertyStat}>
                <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                <Text style={styles.propertyStatText}>{property.views_count ?? 0}</Text>
              </View>
              <View style={styles.propertyStat}>
                <Ionicons name="heart-outline" size={13} color={colors.textMuted} />
                <Text style={styles.propertyStatText}>{property.favorites_count ?? 0}</Text>
              </View>
              <View style={styles.propertyStat}>
                <Ionicons name="images-outline" size={13} color={colors.textMuted} />
                <Text style={styles.propertyStatText}>{property.photos_count ?? property.photos?.length ?? 0}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={19} color="#98A2B3" />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: 'rgba(19,39,86,0.88)',
    borderColor: 'rgba(255,255,255,0.30)',
  },
  heroGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -75,
    top: -105,
    backgroundColor: 'rgba(91,124,255,0.42)',
  },
  heroTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  liveBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6CE9A6',
  },
  liveText: {
    color: '#D5DCFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  today: {
    color: '#C6CDE1',
    fontSize: 11,
  },
  greeting: {
    color: colors.white,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  heroDescription: {
    color: '#D0D5DD',
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  heroHighlights: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroHighlight: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  heroHighlightValue: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '900',
  },
  heroHighlightLabel: {
    color: '#B8C0D7',
    fontSize: 9,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  errorCard: {
    backgroundColor: 'rgba(254,243,242,0.82)',
    borderColor: 'rgba(253,162,155,0.72)',
  },
  errorRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  errorIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,45,32,0.10)',
  },
  errorCopy: { flex: 1, gap: 4 },
  errorTitle: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  errorDescription: { color: '#B42318', fontSize: 12, lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionEyebrow: {
    color: colors.brand,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  sectionLink: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  sectionLinkText: { color: colors.brand, fontSize: 11, fontWeight: '800' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    minHeight: 142,
  },
  metricTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  metricLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  metricCaption: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAction: {
    width: '48%',
    minHeight: 142,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.80)',
    backgroundColor: 'rgba(255,255,255,0.58)',
    padding: spacing.md,
  },
  quickActionPrimary: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  quickIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.17)',
  },
  quickTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  quickTitlePrimary: { color: colors.white },
  quickDescription: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  quickDescriptionPrimary: { color: '#D5DCFF' },
  quickArrow: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  planBadge: {
    maxWidth: '48%',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandSoft,
  },
  planBadgeText: { color: colors.brandDark, fontSize: 10, fontWeight: '900' },
  planCard: { backgroundColor: 'rgba(255,255,255,0.62)' },
  planTopline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  planCopy: { flex: 1, gap: 3 },
  planTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  planDescription: { color: colors.textMuted, fontSize: 11 },
  planPercentage: { color: colors.brandDark, fontSize: 18, fontWeight: '900' },
  progressTrack: {
    height: 9,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(49,87,255,0.10)',
    marginTop: spacing.lg,
  },
  progressFill: {
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  planFooter: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planSlots: { color: colors.text, fontSize: 12, fontWeight: '800' },
  planHint: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  managePlanButton: {
    marginLeft: 'auto',
    minHeight: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandSoft,
  },
  managePlanText: { color: colors.brandDark, fontSize: 11, fontWeight: '900' },
  attentionContent: { paddingVertical: spacing.sm },
  attentionItem: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  attentionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionCopy: { flex: 1, gap: 3 },
  attentionTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  attentionDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  attentionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(152,162,179,0.24)',
  },
  recentList: { gap: spacing.sm },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  propertyImageShell: {
    width: 82,
    height: 82,
    overflow: 'hidden',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(228,231,236,0.72)',
  },
  propertyImage: { width: '100%', height: '100%' },
  propertyCopy: { flex: 1, gap: 4 },
  propertyTopline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3 },
  statusSuccess: { backgroundColor: '#D1FADF' },
  statusWarning: { backgroundColor: '#FEF0C7' },
  statusMuted: { backgroundColor: '#EAECF0' },
  statusText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  statusSuccessText: { color: '#027A48' },
  statusWarningText: { color: '#B54708' },
  statusMutedText: { color: colors.textMuted },
  propertyId: { color: '#98A2B3', fontSize: 9 },
  propertyTitle: { color: colors.text, fontSize: 13, fontWeight: '900', lineHeight: 18 },
  propertyLocation: { color: colors.textMuted, fontSize: 10 },
  propertyStats: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
  propertyStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  propertyStatText: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  emptyState: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  emptyDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  pressed: { opacity: 0.70, transform: [{ scale: 0.98 }] },
});
