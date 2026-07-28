import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';
import { apiClient } from '@/services/apiClient';
import { spacing } from '@/theme/tokens';
import type { PaginatedResponse, Property } from '@/types/api';

export default function FavoritesScreen() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Property>>('/me/favorites?per_page=100'),
    enabled: isAuthenticated,
  });

  if (isBootstrapping) {
    return (
      <Screen>
        <StateView title="Validando sua sessão..." loading />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen>
        <PageHeader
          eyebrow="Favoritos"
          title="Salve imóveis para comparar"
          description="Entre na sua conta para manter sua lista sincronizada."
        />
        <Button label="Entrar na conta" onPress={() => router.push('/entrar')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Carteira salva"
        title="Seus favoritos"
        description="Imóveis que você marcou para acompanhar."
      />

      {favoritesQuery.isLoading ? (
        <StateView title="Carregando favoritos..." loading />
      ) : favoritesQuery.error ? (
        <StateView
          title="Não foi possível carregar os favoritos"
          description={favoritesQuery.error.message}
          actionLabel="Tentar novamente"
          onAction={() => void favoritesQuery.refetch()}
        />
      ) : (favoritesQuery.data?.data.length ?? 0) === 0 ? (
        <StateView
          title="Nenhum favorito"
          description="Abra um imóvel e toque em salvar para encontrá-lo aqui."
          actionLabel="Buscar imóveis"
          onAction={() => router.push('/buscar')}
        />
      ) : (
        <View style={styles.list}>
          {(favoritesQuery.data?.data ?? []).map((property) => (
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
          <Button
            label="Atualizar favoritos"
            variant="secondary"
            onPress={() => {
              void queryClient.invalidateQueries({ queryKey: ['favorites'] });
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
});
