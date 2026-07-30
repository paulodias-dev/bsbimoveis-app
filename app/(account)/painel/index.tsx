import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
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
import { colors, radius, shadow, spacing } from '@/theme/tokens';
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

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function propertyQualityScore(property: Property): number {
  let score = 0;
  const photoCount = property.photos_count ?? property.photos?.length ?? 0;

  if ((property.title ?? '').trim().length >= 12) score += 20;
  if ((property.description ?? '').trim().length >= 80) score += 20;
  if (photoCount >= 5) score += 25;
  else if (photoCount >= 3) score += 17;
  else if (photoCount > 0) score += 8;
  if (property.latitude && property.longitude) score += 20;
  if ((property.price_sale ?? property.price_rent ?? property.price_seasonal_daily ?? 0) > 0) score += 15;

  return score;
}

function formatIntentRate(value: number): string {
  if (!value) return '0%';
  return `${value.toFixed(1)}%`;
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
    const publicationScore = properties.length ? Math.round((published / properties.length) * 100) : 0;
    const qualityScore = properties.length
      ? Math.round(
          properties.reduce((total, property) => total + propertyQualityScore(property), 0) /
            properties.length,
        )
      : 0;
    const intentRate = views ? (favoriteSignals / views) * 100 : 0;

    return {
      published,
      pending,
      drafts,
      views,
      favoriteSignals,
      incomplete,
      publicationScore,
      qualityScore,
      intentRate,
    };
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
  const remainingSlots = subscription?.remaining_slots ?? 0;

  const nextAction = useMemo(() => {
    if (summary.incomplete > 0) {
      return {
        badge: 'Otimizar',
        title: 'Melhorar qualidade',
        description: `${summary.incomplete} anúncio(s) podem receber mais fotos ou localização para melhorar conversão.`,
        buttonLabel: 'Executar agora',
        href: '/painel/desempenho' as const,
      };
    }
    if (summary.pending > 0) {
      return {
        badge: 'Publicação',
        title: 'Acompanhar revisão',
        description: `${summary.pending} anúncio(s) aguardando aprovação para entrar na vitrine.`,
        buttonLabel: 'Ver imóveis',
        href: '/painel/imoveis' as const,
      };
    }
    if (remainingSlots > 0) {
      return {
        badge: 'Expansão',
        title: 'Cadastrar novo imóvel',
        description: `${remainingSlots} vaga(s) ainda disponível(is) no seu plano atual.`,
        buttonLabel: 'Cadastrar agora',
        href: '/painel/imoveis/novo' as const,
      };
    }

    return {
      badge: 'Análise',
      title: 'Explorar desempenho',
      description: 'Revise alcance, favoritos e pontos fortes da carteira para priorizar próximos ajustes.',
      buttonLabel: 'Abrir dados',
      href: '/painel/desempenho' as const,
    };
  }, [remainingSlots, summary.incomplete, summary.pending]);

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
        <View style={styles.heroBadgeRow}>
          <Text style={styles.heroEyebrow}>PAINEL INTELIGENTE</Text>
          <View style={styles.heroDataBadge}>
            <Text style={styles.heroDataBadgeText}>Dados reais</Text>
          </View>
        </View>
        <View style={styles.heroTopline}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>OPERAÇÃO ATIVA</Text>
          </View>
          <Text style={styles.today}>{todayLabel()}</Text>
        </View>
        <Text style={styles.greeting}>{greeting()}, {firstName}.</Text>
        <View style={styles.heroFacts}>
          <InfoPill icon="business-outline" label={`${properties.length} na carteira`} tone="neutral" />
          <InfoPill icon="checkmark-circle-outline" label={`${summary.published} publicados`} tone="success" />
          <InfoPill icon="time-outline" label={`${summary.pending} em revisão`} tone="warning" />
        </View>
        <Text style={styles.heroSupportText}>
          Qualidade, publicação e interesse em um só lugar.
        </Text>
        <View style={styles.heroActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/painel/imoveis/novo')}
            style={({ pressed }) => [
              styles.heroPrimaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.heroPrimaryButtonText}>Cadastrar imóvel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/painel/desempenho')}
            style={({ pressed }) => [
              styles.heroSecondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.heroSecondaryButtonText}>Desempenho</Text>
          </Pressable>
        </View>
        <View style={styles.heroSignalsGrid}>
          <SignalCard label="Publicação" value={`${summary.publicationScore}%`} />
          <SignalCard label="Qualidade" value={`${summary.qualityScore}%`} />
          <SignalCard label="Intenção" value={formatIntentRate(summary.intentRate)} />
          <SignalCard
            label="Vagas"
            value={`${Math.round(clampPercentage(usagePercentage))}%`}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.nextActionCard} intensity={54}>
        <View style={styles.nextActionTopline}>
          <Text style={styles.sectionEyebrow}>PRÓXIMA AÇÃO</Text>
          <View style={styles.nextActionBadge}>
            <Text style={styles.nextActionBadgeText}>{nextAction.badge}</Text>
          </View>
        </View>
        <View style={styles.nextActionBody}>
          <View style={styles.nextActionCopy}>
            <Text style={styles.nextActionTitle}>{nextAction.title}</Text>
            <Text style={styles.nextActionDescription} numberOfLines={3}>
              {nextAction.description}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(nextAction.href)}
            style={({ pressed }) => [styles.nextActionButton, pressed && styles.pressed]}
          >
            <Text style={styles.nextActionButtonText}>{nextAction.buttonLabel}</Text>
          </Pressable>
        </View>
      </GlassCard>

      <View style={styles.snapshotGrid}>
        <SnapshotCard
          title="Imóveis ativos"
          value={summary.published}
          description="Anúncios publicados e visíveis."
          dotColor="#12B76A"
        />
        <SnapshotCard
          title="Visualizações"
          value={summary.views}
          description="Alcance real registrado."
          dotColor="#3157FF"
        />
        <SnapshotCard
          title="Favoritos"
          value={summary.favoriteSignals}
          description="Sinais de interesse."
          dotColor="#F79009"
        />
        <SnapshotCard
          title="Vagas livres"
          value={remainingSlots}
          description={subscription?.plan?.is_free ? 'Plano gratuito' : 'Capacidade atual'}
          dotColor="#667085"
        />
      </View>

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
          <Text style={styles.sectionEyebrow}>RADAR</Text>
          <Text style={styles.sectionTitle}>Pontos de atenção</Text>
        </View>
        <Pressable onPress={() => router.push('/painel/desempenho')} style={styles.sectionLink}>
          <Text style={styles.sectionLinkText}>Detalhes</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.brand} />
        </Pressable>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon="time-outline"
          label="Em revisão"
          value={summary.pending}
          caption={
            summary.pending
              ? 'Aguardando aprovação'
              : 'Nenhum anúncio pendente'
          }
          accent="#F79009"
        />
        <MetricCard
          icon="document-text-outline"
          label="Rascunhos"
          value={summary.drafts}
          caption={
            summary.drafts
              ? 'Prontos para finalizar'
              : 'Carteira sem rascunhos'
          }
          accent="#7A5AF8"
        />
        <MetricCard
          icon="images-outline"
          label="Incompletos"
          value={summary.incomplete}
          caption={
            summary.incomplete
              ? 'Com pouca mídia ou sem mapa'
              : 'Cadastros bem preenchidos'
          }
          accent="#3157FF"
        />
        <MetricCard
          icon="pulse-outline"
          label="Taxa de intenção"
          value={formatIntentRate(summary.intentRate)}
          caption="Favoritos por visualização"
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
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number | string;
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
      <Text style={styles.metricValue}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
    </GlassCard>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroSignalCard}>
      <Text style={styles.heroSignalLabel}>{label}</Text>
      <Text style={styles.heroSignalValue}>{value}</Text>
    </View>
  );
}

function InfoPill({
  icon,
  label,
  tone,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  tone: 'neutral' | 'success' | 'warning';
}) {
  const tint =
    tone === 'success' ? '#12B76A' : tone === 'warning' ? '#F79009' : '#93A3FF';

  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon} size={13} color={tint} />
      <Text style={styles.infoPillText}>{label}</Text>
    </View>
  );
}

function SnapshotCard({
  title,
  value,
  description,
  dotColor,
}: {
  title: string;
  value: number;
  description: string;
  dotColor: string;
}) {
  return (
    <GlassCard style={styles.snapshotCard} padding={spacing.md} intensity={34}>
      <View style={styles.snapshotTopline}>
        <Text style={styles.snapshotTitle}>{title}</Text>
        <View style={[styles.snapshotDot, { backgroundColor: dotColor }]} />
      </View>
      <Text style={styles.snapshotValue}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={styles.snapshotDescription}>{description}</Text>
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
  icon: ComponentProps<typeof Ionicons>['name'];
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
  icon: ComponentProps<typeof Ionicons>['name'];
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
    borderColor: '#1E3C71',
    backgroundColor: '#10284D',
    overflow: 'hidden',
    shadowColor: '#10284D',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
    elevation: 8,
  },
  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -68,
    top: -88,
    backgroundColor: 'rgba(91,124,255,0.18)',
  },
  heroTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroEyebrow: {
    color: '#93A3FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  heroDataBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroDataBadgeText: {
    color: '#D5DCFF',
    fontSize: 11,
    fontWeight: '800',
  },
  liveBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
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
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  heroFacts: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  infoPill: {
    minHeight: 30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoPillText: {
    color: '#E6EBFF',
    fontSize: 10,
    fontWeight: '800',
  },
  heroSupportText: {
    color: '#D0D5DD',
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  heroActionRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroPrimaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  heroPrimaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  heroSecondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  heroSecondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  heroSignalsGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroSignalCard: {
    width: '23%',
    minHeight: 74,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroSignalLabel: {
    color: '#D5DCFF',
    fontSize: 9,
    lineHeight: 12,
  },
  heroSignalValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  nextActionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7ECF3',
  },
  nextActionTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nextActionBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: '#FFF5E8',
  },
  nextActionBadgeText: {
    color: '#DC6803',
    fontSize: 11,
    fontWeight: '800',
  },
  nextActionBody: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  nextActionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  nextActionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  nextActionDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  nextActionButton: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  nextActionButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  snapshotCard: {
    width: '48%',
    minHeight: 138,
    backgroundColor: '#FFFFFF',
    borderColor: '#E7ECF3',
  },
  snapshotTopline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  snapshotTitle: {
    flex: 1,
    color: '#667085',
    fontSize: 12,
    fontWeight: '800',
  },
  snapshotDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 2,
  },
  snapshotValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  snapshotDescription: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  errorCard: {
    backgroundColor: '#FFF7F5',
    borderColor: '#F7C9C2',
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
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
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
    backgroundColor: '#FFFFFF',
    borderColor: '#E7ECF3',
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
    fontSize: 24,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  metricLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  metricCaption: {
    color: colors.textMuted,
    fontSize: 9,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    ...shadow.card,
  },
  quickActionPrimary: {
    borderColor: '#1E3C71',
    backgroundColor: '#17356A',
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
  planCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7ECF3',
  },
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
    backgroundColor: '#F3F5F9',
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
