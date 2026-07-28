import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, radius, spacing } from '@/theme/tokens';

export default function MessagesScreen() {
  const { properties, isLoading, hydrate } = usePainelStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const entries = useMemo(
    () =>
      [...properties]
        .filter((property) => (property.views_count ?? 0) > 0)
        .sort((left, right) => (right.views_count ?? 0) - (left.views_count ?? 0))
        .slice(0, 6),
    [properties],
  );

  if (isLoading && properties.length === 0) {
    return (
      <Screen>
        <StateView title="Carregando oportunidades..." loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Atendimento"
        title="Mensagens e oportunidades"
        description="Priorize os anúncios que estão recebendo atividade."
      />

      <Card style={styles.notice}>
        <Text style={styles.noticeTitle}>Limite atual da API</Text>
        <Text style={styles.noticeText}>
          O portal ainda não expõe conversas ou mensagens reais. Esta tela preserva o comportamento do web e destaca prioridades pela quantidade de visualizações.
        </Text>
      </Card>

      {entries.length === 0 ? (
        <StateView
          title="Sem novas interações"
          description="Quando seus anúncios receberem visualizações, as prioridades aparecerão aqui."
          actionLabel="Gerenciar imóveis"
          onAction={() => router.push('/painel/imoveis')}
        />
      ) : (
        <View style={styles.list}>
          {entries.map((property, index) => (
            <Card key={property.id} style={styles.item}>
              <View style={styles.rank}><Text style={styles.rankText}>{index + 1}</Text></View>
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
                <Text style={styles.hint}>
                  {property.views_count} visualizações recentes — priorize uma resposta rápida.
                </Text>
                <Text style={styles.meta}>
                  {property.neighborhood ?? property.city ?? 'Localização não informada'}
                </Text>
              </View>
              <Button
                label="Abrir"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/painel/imoveis/[id]/editar',
                    params: { id: String(property.id) },
                  })
                }
                style={styles.button}
              />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { gap: spacing.sm, backgroundColor: '#FFFAEB', borderColor: '#FEC84B' },
  noticeTitle: { color: '#93370D', fontSize: 14, fontWeight: '900' },
  noticeText: { color: '#B54708', fontSize: 12, lineHeight: 18 },
  list: { gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  rankText: { color: colors.brandDark, fontSize: 13, fontWeight: '900' },
  copy: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: 14, fontWeight: '800' },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  meta: { color: colors.brand, fontSize: 10, fontWeight: '700' },
  button: { minHeight: 40, paddingHorizontal: spacing.sm },
});
