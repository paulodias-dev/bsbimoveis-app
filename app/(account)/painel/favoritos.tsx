import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { apiClient } from '@/services/apiClient';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, spacing } from '@/theme/tokens';

export default function PanelFavoritesScreen() {
  const { favorites, isLoading, hydrate } = usePainelStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  async function removeFavorite(propertyId: number) {
    await apiClient.delete(`/properties/${propertyId}/favorite`);
    await hydrate();
  }

  if (isLoading && favorites.length === 0) {
    return (
      <Screen>
        <StateView title="Carregando favoritos..." loading />
      </Screen>
    );
  }

  const withPhotos = favorites.filter(
    (property) => property.cover_photo || property.photos?.length,
  ).length;
  const totalViews = favorites.reduce(
    (sum, property) => sum + (property.views_count ?? 0),
    0,
  );
  const available = favorites.filter(
    (property) => property.is_published || property.publication_status === 'approved',
  ).length;

  return (
    <Screen>
      <PageHeader
        eyebrow="Carteira salva"
        title="Favoritos"
        description="Acompanhe imóveis salvos com imagem, preço, localização e disponibilidade."
      />

      <View style={styles.metrics}>
        <Metric label="Salvos" value={favorites.length} />
        <Metric label="Com fotos" value={withPhotos} />
        <Metric label="Visualizações" value={totalViews} />
        <Metric label="Disponíveis" value={available} />
      </View>

      {favorites.length === 0 ? (
        <StateView
          title="Nenhum favorito"
          description="Salve imóveis na vitrine para acompanhar oportunidades por aqui."
          actionLabel="Buscar imóveis"
          onAction={() => router.push('/buscar')}
        />
      ) : (
        <View style={styles.list}>
          {favorites.map((property) => (
            <View key={property.id} style={styles.item}>
              <PropertyCard
                property={property}
                onPress={() =>
                  router.push({
                    pathname: '/imoveis/[id]',
                    params: { id: String(property.id) },
                  })
                }
              />
              <Button
                label="Remover dos favoritos"
                variant="secondary"
                onPress={() => void removeFavorite(property.id)}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '48%', gap: spacing.xs, alignItems: 'center' },
  metricValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontSize: 11 },
  list: { gap: spacing.lg },
  item: { gap: spacing.sm },
});
