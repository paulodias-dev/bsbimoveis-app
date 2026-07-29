import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/AuthProvider';
import { apiClient } from '@/services/apiClient';
import { colors, radius, shadow, spacing } from '@/theme/tokens';
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

function currencyValue(value: number | null): string {
  if (value === null) return 'Não informado';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function Gallery({
  photos,
  title,
}: {
  photos: PropertyPhoto[];
  title: string;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<PropertyPhoto>>(null);
  const thumbsRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(
    Math.max(windowWidth - spacing.lg * 2, 280),
  );
  const slideWidth = Math.max(containerWidth, 280);
  const imageHeight = Math.min(Math.max(slideWidth * 0.72, 250), 380);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(photos.length - 1, 0)));
  }, [photos.length]);

  useEffect(() => {
    thumbsRef.current?.scrollTo({
      x: Math.max(activeIndex * 84 - slideWidth / 3, 0),
      animated: true,
    });
  }, [activeIndex, slideWidth]);

  function goToIndex(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), photos.length - 1);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  }

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!slideWidth) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), photos.length - 1));
  }

  if (photos.length === 0) {
    return (
      <View style={styles.galleryCard}>
        <View style={[styles.photoFallback, { height: imageHeight }]}>
          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
          <Text style={styles.photoFallbackText}>Foto indisponível</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.galleryCard}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && Math.abs(nextWidth - containerWidth) > 1) {
          setContainerWidth(nextWidth);
        }
      }}
    >
      <View style={[styles.galleryStage, { height: imageHeight }]}>
        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.url }}
              style={[styles.photo, { width: slideWidth, height: imageHeight }]}
              resizeMode="cover"
            />
          )}
          getItemLayout={(_, index) => ({
            length: slideWidth,
            offset: slideWidth * index,
            index,
          })}
        />

        {photos.length > 1 ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Foto anterior"
              onPress={() => goToIndex(activeIndex - 1)}
              style={({ pressed }) => [
                styles.galleryArrow,
                styles.galleryArrowLeft,
                pressed && styles.galleryArrowPressed,
              ]}
            >
              <Ionicons name="chevron-back" size={26} color={colors.white} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Próxima foto"
              onPress={() => goToIndex(activeIndex + 1)}
              style={({ pressed }) => [
                styles.galleryArrow,
                styles.galleryArrowRight,
                pressed && styles.galleryArrowPressed,
              ]}
            >
              <Ionicons name="chevron-forward" size={26} color={colors.white} />
            </Pressable>
          </>
        ) : null}

        <View style={styles.galleryTopRow}>
          <View style={styles.galleryCountBadge}>
            <Ionicons name="images-outline" size={14} color={colors.white} />
            <Text style={styles.galleryCountText}>
              {activeIndex + 1}/{photos.length}
            </Text>
          </View>
        </View>

        {photos.length > 1 ? (
          <View style={styles.galleryFooterOverlay}>
            <View style={styles.swipeHint}>
              <Ionicons name="swap-horizontal-outline" size={14} color={colors.white} />
              <Text style={styles.swipeHintText}>Deslize para navegar pelas fotos</Text>
            </View>
            <View style={styles.dots}>
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ir para foto ${index + 1}`}
                  onPress={() => goToIndex(index)}
                  style={[styles.dot, index === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {photos.length > 1 ? (
        <ScrollView
          ref={thumbsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbList}
        >
          {photos.map((photo, index) => {
            const selected = index === activeIndex;

            return (
              <Pressable
                key={photo.id}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar foto ${index + 1} de ${title}`}
                onPress={() => goToIndex(index)}
                style={[styles.thumbShell, selected && styles.thumbShellActive]}
              >
                <Image source={{ uri: photo.url }} style={styles.thumbImage} resizeMode="cover" />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
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
  const summaryMetrics = [
    {
      icon: 'camera-outline' as const,
      label: 'Fotos',
      value: String(photos.length),
    },
    {
      icon: 'eye-outline' as const,
      label: 'Visualizações',
      value: String(property.views_count ?? 0),
    },
    {
      icon: property.is_favorited ? ('heart' as const) : ('heart-outline' as const),
      label: 'Favoritos',
      value: String(property.favorites_count ?? 0),
    },
  ];
  const pricingDetails = [
    {
      label: 'Condomínio',
      value: currencyValue(property.condo_fee),
    },
    {
      label: 'IPTU',
      value: currencyValue(property.iptu),
    },
  ];

  return (
    <Screen>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.topbarButton, pressed && styles.topbarButtonPressed]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.topbarButtonText}>Voltar</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartilhar anúncio"
          onPress={() =>
            void Share.share({
              title: property.title,
              message: `${property.title}\n${env.frontendUrl}/imoveis/${property.id}`,
            })
          }
          style={({ pressed }) => [styles.topbarIconButton, pressed && styles.topbarButtonPressed]}
        >
          <Ionicons name="share-social-outline" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.badges}>
          <Text style={styles.badge}>{purposeLabel(property.purpose)}</Text>
          {property.category?.name ? (
            <Text style={styles.secondaryBadge}>{property.category.name}</Text>
          ) : null}
        </View>
        <Text style={styles.title}>{property.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.location}>
            {propertyLocation(property) || 'Localização não informada'}
          </Text>
        </View>
        <Text style={styles.price}>{propertyPrice(property)}</Text>
      </View>

      <View style={styles.metricsRow}>
        {summaryMetrics.map((metric) => (
          <View key={metric.label} style={styles.metricChip}>
            <Ionicons name={metric.icon} size={16} color={colors.brandDark} />
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <Gallery photos={photos} title={property.title} />

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
        <Text style={styles.sectionTitle}>Valor anunciado</Text>
        <Text style={styles.priceHighlight}>{propertyPrice(property)}</Text>
        <View style={styles.priceGrid}>
          {pricingDetails.map((item) => (
            <View key={item.label} style={styles.priceItem}>
              <Text style={styles.priceItemLabel}>{item.label}</Text>
              <Text style={styles.priceItemValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </Card>

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
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  topbarIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  topbarButtonPressed: {
    opacity: 0.84,
  },
  topbarButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  header: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  secondaryBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
  },
  price: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricChip: {
    flex: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  metricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  galleryCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  galleryStage: {
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  photo: {
    backgroundColor: colors.surfaceAlt,
  },
  photoFallback: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  photoFallbackText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  galleryArrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 3,
    width: 42,
    height: 42,
    marginTop: -21,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,24,40,0.38)',
  },
  galleryArrowLeft: {
    left: spacing.sm,
  },
  galleryArrowRight: {
    right: spacing.sm,
  },
  galleryArrowPressed: {
    opacity: 0.82,
  },
  galleryTopRow: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
  },
  galleryCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(16,24,40,0.52)',
  },
  galleryCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  galleryFooterOverlay: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    left: spacing.sm,
    gap: spacing.sm,
    zIndex: 2,
  },
  swipeHint: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(16,24,40,0.46)',
  },
  swipeHintText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.white,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: colors.white,
  },
  thumbList: {
    gap: spacing.sm,
  },
  thumbShell: {
    width: 72,
    height: 72,
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceAlt,
  },
  thumbShellActive: {
    borderColor: colors.brand,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
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
  priceHighlight: {
    color: colors.brandDark,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceItem: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.xs,
  },
  priceItemLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  priceItemValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specItem: {
    minWidth: '48%',
    flexGrow: 1,
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
