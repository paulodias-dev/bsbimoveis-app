import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/AuthProvider';
import { apiClient } from '@/services/apiClient';
import { colors, radius, spacing } from '@/theme/tokens';
import type {
  MessageResponse,
  Property,
  PropertyPhoto,
  ResourceResponse,
} from '@/types/api';
import {
  propertyLocation,
  propertyPrice,
  purposeLabel,
} from '@/utils/format';

function whatsappUrl(property: Property): string | null {
  const phone =
    property.user?.whatsapp ||
    property.user?.phone ||
    property.user?.company_whatsapp ||
    property.user?.company_phone;

  if (!phone) return null;

  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const message = `Olá! Tenho interesse no imóvel "${property.title}" anunciado na BSB Imóveis.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Number(id);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const propertyQuery = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () =>
      apiClient.get<ResourceResponse<Property>>(`/properties/${propertyId}`, {
        auth: isAuthenticated,
      }),
    enabled: Number.isFinite(propertyId) && propertyId > 0,
  });

  const property = propertyQuery.data?.data;
  const photos = useMemo(() => {
    if (!property) return [];
    const source = [property.cover_photo, ...(property.photos ?? [])].filter(
      (photo): photo is PropertyPhoto => Boolean(photo?.url),
    );
    return source.filter(
      (photo, index) => source.findIndex((item) => item.url === photo.url) === index,
    );
  }, [property]);

  async function toggleFavorite() {
    if (!property) return;

    if (!isAuthenticated) {
      router.push('/entrar');
      return;
    }

    setFavoriteBusy(true);
    try {
      if (property.is_favorited) {
        await apiClient.delete<MessageResponse>(`/properties/${property.id}/favorite`);
      } else {
        await apiClient.post<MessageResponse>(`/properties/${property.id}/favorite`);
      }

      await Promise.all([
        propertyQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['favorites'] }),
      ]);
    } finally {
      setFavoriteBusy(false);
    }
  }

  if (propertyQuery.isLoading) {
    return (
      <Screen>
        <StateView title="Carregando imóvel..." loading />
      </Screen>
    );
  }

  if (propertyQuery.error || !property) {
    return (
      <Screen>
        <StateView
          title="Imóvel não encontrado"
          description={propertyQuery.error?.message}
          actionLabel="Voltar para a busca"
          onAction={() => router.replace('/buscar')}
        />
      </Screen>
    );
  }

  const contactUrl = whatsappUrl(property);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.badge}>{purposeLabel(property.purpose)}</Text>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.location}>
          {propertyLocation(property) || 'Localização não informada'}
        </Text>
        <Text style={styles.price}>{propertyPrice(property)}</Text>
      </View>

      {photos.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
        >
          {photos.map((photo) => (
            <Image key={photo.id} source={{ uri: photo.url }} style={styles.photo} />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Text style={styles.photoFallbackText}>Foto indisponível</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          label={
            favoriteBusy
              ? 'Atualizando...'
              : property.is_favorited
                ? 'Remover dos favoritos'
                : 'Salvar nos favoritos'
          }
          variant="secondary"
          loading={favoriteBusy}
          onPress={() => void toggleFavorite()}
        />
        <Button
          label="Compartilhar anúncio"
          variant="secondary"
          onPress={() =>
            void Share.share({
              title: property.title,
              message: `${property.title}\n${env.frontendUrl}/imoveis/${property.id}`,
            })
          }
        />
        <Button
          label="Falar com o anunciante"
          disabled={!contactUrl}
          onPress={() => {
            if (contactUrl) void Linking.openURL(contactUrl);
          }}
        />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Características</Text>
        <View style={styles.specGrid}>
          {[
            ['Quartos', property.bedrooms ?? 'Não informado'],
            ['Banheiros', property.bathrooms ?? 'Não informado'],
            ['Garagem', property.parking_spaces ?? 'Não informado'],
            ['Área útil', property.area_useful ? `${property.area_useful} m²` : 'Não informado'],
            ['Área total', property.area_total ? `${property.area_total} m²` : 'Não informado'],
            ['Categoria', property.category?.name ?? 'Não informado'],
          ].map(([label, value]) => (
            <View key={String(label)} style={styles.specItem}>
              <Text style={styles.specLabel}>{label}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Descrição</Text>
        <Text style={styles.description}>
          {property.description?.trim() ||
            'O anunciante ainda não informou uma descrição detalhada.'}
        </Text>
      </Card>

      {property.amenities.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Comodidades</Text>
          <View style={styles.amenities}>
            {property.amenities.map((amenity) => (
              <Text key={amenity.id} style={styles.amenity}>
                {amenity.name}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    color: colors.brandDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
  },
  location: {
    color: colors.textMuted,
    fontSize: 15,
  },
  price: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: '900',
  },
  gallery: {
    marginHorizontal: -spacing.lg,
  },
  photo: {
    width: 390,
    height: 270,
    backgroundColor: colors.surfaceAlt,
  },
  photoFallback: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  photoFallbackText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specItem: {
    width: '48%',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.xs,
  },
  specLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  specValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenity: {
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    color: colors.brandDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
  },
});
