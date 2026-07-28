import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { apiClient } from '@/services/apiClient';
import { colors, radius, spacing } from '@/theme/tokens';
import type {
  CollectionResponse,
  PaginatedResponse,
  Property,
  PropertyCategory,
} from '@/types/api';

export default function HomeScreen() {
  const homeQuery = useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const [properties, categories] = await Promise.all([
        apiClient.get<PaginatedResponse<Property>>('/properties?per_page=8', {
          auth: false,
        }),
        apiClient.get<CollectionResponse<PropertyCategory>>('/property-categories', {
          auth: false,
        }),
      ]);

      return { properties: properties.data, categories: categories.data };
    },
  });

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Portal BSB Imóveis</Text>
        <Text style={styles.heroTitle}>Encontre seu próximo imóvel em poucos toques.</Text>
        <Text style={styles.heroDescription}>
          Busque por cidade, compare oportunidades no mapa e fale diretamente com o anunciante.
        </Text>
        <View style={styles.actions}>
          <Button label="Buscar imóveis" onPress={() => router.push('/buscar')} />
          <Button
            label="Ver no mapa"
            variant="secondary"
            onPress={() => router.push('/ver-no-mapa')}
          />
        </View>
      </View>

      {homeQuery.isLoading ? (
        <Card>
          <StateView title="Carregando imóveis..." loading />
        </Card>
      ) : homeQuery.error ? (
        <Card>
          <StateView
            title="Não foi possível carregar a vitrine"
            description={homeQuery.error.message}
            actionLabel="Tentar novamente"
            onAction={() => void homeQuery.refetch()}
          />
        </Card>
      ) : (
        <>
          <View style={styles.section}>
            <PageHeader
              eyebrow="Categorias"
              title="Comece pela categoria"
              description="As categorias são carregadas diretamente da API do portal."
            />
            <View style={styles.categoryGrid}>
              {homeQuery.data.categories.slice(0, 8).map((category) => (
                <Card key={category.id} style={styles.categoryCard}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </Card>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <PageHeader
              eyebrow="Oportunidades"
              title="Imóveis recentes"
              description="Anúncios publicados e disponíveis na vitrine."
            />
            <View style={styles.list}>
              {homeQuery.data.properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onPress={() =>
                    router.push({
                      pathname: '/imoveis/[id]',
                      params: { id: String(property.id) },
                    })
                  }
                />
              ))}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.mapMarker,
  },
  kicker: {
    color: '#BFCBFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '900',
  },
  heroDescription: {
    color: '#D0D5DD',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  section: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '48%',
    minHeight: 76,
    justifyContent: 'center',
  },
  categoryName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
