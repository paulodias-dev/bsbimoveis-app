import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { getMyReferralSummary } from '@/features/referrals/referralService';
import type { ReferralUseSummary } from '@/features/referrals/types';
import { colors, radius, spacing } from '@/theme/tokens';

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Não definida';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));
}

function statusTone(status: string | null): { background: string; text: string } {
  if (status === 'rewarded' || status === 'qualified' || status === 'active') {
    return { background: '#D1FADF', text: '#027A48' };
  }
  if (status === 'pending') return { background: '#FEF0C7', text: '#B54708' };
  if (status === 'rejected' || status === 'cancelled' || status === 'blocked') {
    return { background: '#FEE4E2', text: colors.danger };
  }
  return { background: colors.surfaceAlt, text: colors.textMuted };
}

function ReferralHistoryItem({ item }: { item: ReferralUseSummary }) {
  const tone = statusTone(item.status);
  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyCopy}>
          <Text style={styles.historyName}>{item.referred?.name ?? 'Cliente indicado'}</Text>
          <Text style={styles.historyDate}>Uso em {formatDate(item.used_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: tone.background }]}>
          <Text style={[styles.statusText, { color: tone.text }]}> 
            {item.status_label ?? item.status ?? 'Sem status'}
          </Text>
        </View>
      </View>
      <Text style={styles.historyReward}>
        Recompensa: {item.rewarded_at ? formatDate(item.rewarded_at) : 'Aguardando'}
      </Text>
      {item.rejection_reason ? (
        <Text style={styles.rejection}>Motivo: {item.rejection_reason}</Text>
      ) : null}
    </View>
  );
}

export default function ReferralsScreen() {
  const referralsQuery = useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: getMyReferralSummary,
  });

  if (referralsQuery.isLoading) {
    return (
      <Screen>
        <StateView title="Carregando suas indicações..." loading />
      </Screen>
    );
  }

  if (referralsQuery.error) {
    return (
      <Screen>
        <StateView
          title="Não foi possível carregar as indicações"
          description={referralsQuery.error.message}
          actionLabel="Tentar novamente"
          onAction={() => void referralsQuery.refetch()}
        />
      </Screen>
    );
  }

  const data = referralsQuery.data?.data;
  if (!data?.code) {
    return (
      <Screen>
        <PageHeader
          eyebrow="Indique e ganhe"
          title="Cupons e indicações"
          description="Compartilhe seu cupom e acompanhe recompensas."
        />
        <StateView
          title="Nenhum cupom ativo"
          description="Quando uma campanha estiver disponível para sua conta, o cupom aparecerá automaticamente aqui."
          actionLabel="Atualizar"
          onAction={() => void referralsQuery.refetch()}
        />
      </Screen>
    );
  }

  const { code, program, metrics, uses } = data;
  const shareText = `Ganhe benefícios na BSB Imóveis usando meu cupom ${code.code}: ${code.share_url}`;
  const codeTone = statusTone(code.status);

  async function copyCoupon() {
    await Clipboard.setStringAsync(code.code);
  }

  async function copyLink() {
    await Clipboard.setStringAsync(code.share_url);
  }

  async function shareCoupon() {
    await Share.share({ title: 'Meu cupom BSB Imóveis', message: shareText });
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Indique e ganhe"
        title="Cupons e indicações"
        description="Compartilhe seu cupom, acompanhe ativações e veja quando as recompensas forem liberadas."
      />

      <Card style={styles.couponCard}>
        <View style={styles.couponHeader}>
          <View style={styles.couponCopy}>
            <View style={[styles.statusBadge, { backgroundColor: codeTone.background }]}>
              <Text style={[styles.statusText, { color: codeTone.text }]}>
                {code.status_label ?? 'Status do cupom'}
              </Text>
            </View>
            <Text style={styles.code}>{code.code}</Text>
            <Text style={styles.description}>
              Compartilhe com clientes e parceiros. O link já preenche o cupom no cadastro.
            </Text>
          </View>
          <View style={styles.useCard}>
            <Text style={styles.useCount}>{code.uses_count}</Text>
            <Text style={styles.useLabel}>usos</Text>
            <Text style={styles.remaining}>
              {code.remaining_uses === null ? 'sem limite' : `${code.remaining_uses} restantes`}
            </Text>
          </View>
        </View>

        <View style={styles.linkBox}>
          <Text style={styles.linkLabel}>Link de compartilhamento</Text>
          <Text style={styles.link} selectable>{code.share_url}</Text>
        </View>

        <View style={styles.actions}>
          <Button label="Copiar cupom" onPress={() => void copyCoupon()} style={styles.action} />
          <Button
            label="Compartilhar"
            variant="secondary"
            onPress={() => void shareCoupon()}
            style={styles.action}
          />
        </View>
        <Button label="Copiar link" variant="secondary" onPress={() => void copyLink()} />
      </Card>

      <View style={styles.metricsGrid}>
        <Metric label="Indicações" value={metrics.total_uses} description="Cadastros iniciados." />
        <Metric label="Em análise" value={metrics.pending_uses} description="Aguardando qualificação." />
        <Metric label="Recompensadas" value={metrics.rewarded_uses} description="Benefício liberado." />
        <Metric label="Pendentes" value={metrics.pending_rewards} description="Recompensas a processar." />
      </View>

      <Card style={styles.programCard}>
        <Text style={styles.sectionKicker}>CAMPANHA ATIVA</Text>
        <Text style={styles.sectionTitle}>{program?.name ?? 'Campanha de indicação'}</Text>
        <Text style={styles.description}>
          {program?.description ?? 'Campanha disponível para compartilhamento do seu cupom.'}
        </Text>
        <View style={styles.periodGrid}>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>Início</Text>
            <Text style={styles.periodValue}>{formatDate(program?.starts_at)}</Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>Encerramento</Text>
            <Text style={styles.periodValue}>{formatDate(program?.ends_at)}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.benefitsCard}>
        <Text style={styles.sectionTitle}>Benefícios do cupom</Text>
        {program?.benefits_preview.length ? (
          <View style={styles.benefitsList}>
            {program.benefits_preview.map((benefit) => (
              <View key={`${benefit.target}-${benefit.type}-${benefit.label}`} style={styles.benefit}>
                <Text style={styles.benefitTarget}>
                  {benefit.target === 'referrer' ? 'PARA VOCÊ' : 'PARA O INDICADO'}
                </Text>
                <Text style={styles.benefitLabel}>{benefit.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.description}>Os benefícios ainda não foram detalhados pela campanha.</Text>
        )}
      </Card>

      <Card style={styles.historyCard}>
        <View style={styles.historyTitleRow}>
          <Text style={styles.sectionTitle}>Histórico de indicações</Text>
          <Text style={styles.historyCount}>{uses.length}</Text>
        </View>
        {uses.length ? (
          <View style={styles.historyList}>
            {uses.map((item) => <ReferralHistoryItem key={item.id} item={item} />)}
          </View>
        ) : (
          <Text style={styles.description}>Nenhuma indicação registrada até agora.</Text>
        )}
      </Card>

      <Button label="Atualizar dados" variant="secondary" onPress={() => void referralsQuery.refetch()} />
    </Screen>
  );
}

function Metric({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDescription}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  couponCard: { gap: spacing.md, backgroundColor: '#F8F9FF', borderColor: '#C7D2FE' },
  couponHeader: { flexDirection: 'row', gap: spacing.md },
  couponCopy: { flex: 1, gap: spacing.sm },
  statusBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '900' },
  code: { color: colors.brandDark, fontSize: 30, fontWeight: '900', letterSpacing: 1.4 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  useCard: { minWidth: 94, borderRadius: radius.md, backgroundColor: colors.white, padding: spacing.md, alignItems: 'center' },
  useCount: { color: colors.text, fontSize: 25, fontWeight: '900' },
  useLabel: { color: colors.textMuted, fontSize: 11 },
  remaining: { color: colors.brand, fontSize: 10, fontWeight: '700', marginTop: spacing.xs, textAlign: 'center' },
  linkBox: { borderRadius: radius.md, backgroundColor: colors.white, padding: spacing.md, gap: spacing.xs },
  linkLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900' },
  link: { color: colors.text, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1, paddingHorizontal: spacing.sm },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '48%', gap: spacing.xs },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: '900' },
  metricDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  programCard: { gap: spacing.sm },
  sectionKicker: { color: colors.brand, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  periodGrid: { flexDirection: 'row', gap: spacing.sm },
  periodItem: { flex: 1, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, padding: spacing.md, gap: spacing.xs },
  periodLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' },
  periodValue: { color: colors.text, fontSize: 12, fontWeight: '800' },
  benefitsCard: { gap: spacing.md },
  benefitsList: { gap: spacing.sm },
  benefit: { borderRadius: radius.md, backgroundColor: colors.surfaceAlt, padding: spacing.md, gap: spacing.xs },
  benefitTarget: { color: colors.brand, fontSize: 9, fontWeight: '900' },
  benefitLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
  historyCard: { gap: spacing.md },
  historyTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyCount: { color: colors.brand, fontSize: 14, fontWeight: '900' },
  historyList: { gap: spacing.sm },
  historyItem: { borderRadius: radius.md, backgroundColor: colors.surfaceAlt, padding: spacing.md, gap: spacing.sm },
  historyHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  historyCopy: { flex: 1, gap: spacing.xs },
  historyName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  historyDate: { color: colors.textMuted, fontSize: 11 },
  historyReward: { color: colors.textMuted, fontSize: 12 },
  rejection: { color: colors.danger, fontSize: 11 },
});
