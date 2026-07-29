import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { apiClient } from '@/services/apiClient';
import { colors, radius, shadow, spacing } from '@/theme/tokens';
import type { PaginatedResponse, Property, PropertyPurpose } from '@/types/api';
import {
  formatCurrency,
  propertyLocation,
  propertyPrice,
  purposeLabel,
} from '@/utils/format';

const initialRegion: Region = {
  latitude: -15.793889,
  longitude: -47.882778,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

const purposeFilters: Array<{
  value: PropertyPurpose | '';
  label: string;
}> = [
  { value: '', label: 'Todos' },
  { value: 'sale', label: 'Venda' },
  { value: 'rent', label: 'Aluguel' },
  { value: 'seasonal', label: 'Temporada' },
];

const priceRanges = [
  { key: 'all', label: 'Qualquer valor', min: null, max: null },
  { key: 'up_to_300k', label: 'Até R$ 300 mil', min: null, max: 300000 },
  { key: '300k_to_700k', label: 'R$ 300 mil a R$ 700 mil', min: 300000, max: 700000 },
  { key: '700k_to_1m', label: 'R$ 700 mil a R$ 1 mi', min: 700000, max: 1000000 },
  { key: 'over_1m', label: 'Acima de R$ 1 mi', min: 1000000, max: null },
] as const;

function regionToBounds(region: Region) {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;

  return {
    sw_lat: region.latitude - halfLat,
    sw_lng: region.longitude - halfLng,
    ne_lat: region.latitude + halfLat,
    ne_lng: region.longitude + halfLng,
  };
}

function propertyNumericPrice(property: Property): number | null {
  if (property.purpose === 'rent') return property.price_rent;
  if (property.purpose === 'seasonal') return property.price_seasonal_daily;
  return property.price_sale;
}

function formatMapPrice(value: number | null): string {
  if (value === null || !Number.isFinite(Number(value))) {
    return 'Consulte';
  }

  return formatCurrency(Number(value));
}

function imageUrl(property: Property): string | null {
  return property.cover_photo?.url ?? property.photos?.[0]?.url ?? null;
}

function pinWidth(label: string, mapWidth = 220): number {
  const idealWidth = 34 + label.length * 9.5;
  const maxAllowedWidth = Math.max(108, mapWidth - 12);

  return Math.min(Math.max(108, idealWidth), maxAllowedWidth);
}

function regionsDiffer(current: Region, next: Region): boolean {
  return (
    Math.abs(current.latitude - next.latitude) > 0.0005 ||
    Math.abs(current.longitude - next.longitude) > 0.0005 ||
    Math.abs(current.latitudeDelta - next.latitudeDelta) > 0.0005 ||
    Math.abs(current.longitudeDelta - next.longitudeDelta) > 0.0005
  );
}

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [viewportRegion, setViewportRegion] = useState<Region>(initialRegion);
  const [queryRegion, setQueryRegion] = useState<Region>(initialRegion);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [selectedPurpose, setSelectedPurpose] = useState<PropertyPurpose | ''>('');
  const [selectedPriceKey, setSelectedPriceKey] =
    useState<(typeof priceRanges)[number]['key']>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draftPurpose, setDraftPurpose] = useState<PropertyPurpose | ''>('');
  const [draftPriceKey, setDraftPriceKey] =
    useState<(typeof priceRanges)[number]['key']>('all');
  const [pinPositions, setPinPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const selectedPriceRange =
    priceRanges.find((range) => range.key === selectedPriceKey) ?? priceRanges[0];
  const selectedPurposeLabel =
    purposeFilters.find((item) => item.value === selectedPurpose)?.label ?? 'Todos';
  const activeFilterCount =
    (selectedPurpose ? 1 : 0) + (selectedPriceKey !== 'all' ? 1 : 0);

  const queryString = useMemo(() => {
    const bounds = regionToBounds(queryRegion);
    const params = new URLSearchParams({
      per_page: '60',
      sw_lat: bounds.sw_lat.toFixed(6),
      sw_lng: bounds.sw_lng.toFixed(6),
      ne_lat: bounds.ne_lat.toFixed(6),
      ne_lng: bounds.ne_lng.toFixed(6),
    });

    if (selectedPurpose) {
      params.set('purpose', selectedPurpose);
    }

    if (selectedPriceRange.min !== null) {
      params.set('min_price', String(selectedPriceRange.min));
    }

    if (selectedPriceRange.max !== null) {
      params.set('max_price', String(selectedPriceRange.max));
    }

    return params.toString();
  }, [queryRegion, selectedPriceRange.max, selectedPriceRange.min, selectedPurpose]);

  const propertiesQuery = useQuery({
    queryKey: ['map-properties', queryString],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Property>>(`/properties?${queryString}`, {
        auth: false,
      }),
    placeholderData: (previousData) => previousData,
  });

  async function useMyLocation() {
    setIsLocating(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError('Permita o acesso à localização para usar este recurso.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextRegion: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };

      setViewportRegion(nextRegion);
      setQueryRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 500);
    } catch {
      setLocationError('Não foi possível obter sua localização.');
    } finally {
      setIsLocating(false);
    }
  }

  const properties = (propertiesQuery.data?.data ?? []).filter(
    (property) =>
      property.latitude !== null &&
      property.longitude !== null &&
      Number.isFinite(Number(property.latitude)) &&
      Number.isFinite(Number(property.longitude)),
  );
  const mapSearchSubtitle =
    activeFilterCount > 0
      ? `${properties.length} anúncio(s) · ${selectedPurposeLabel} · ${selectedPriceRange.label}`
      : `${properties.length} anúncio(s) nesta área`;

  const selectedProperty =
    properties.find((property) => property.id === selectedPropertyId) ?? null;

  useEffect(() => {
    if (selectedPropertyId === null) return;
    if (!properties.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(null);
    }
  }, [properties, selectedPropertyId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setQueryRegion((current) =>
        regionsDiffer(current, viewportRegion) ? viewportRegion : current,
      );
    }, 320);

    return () => clearTimeout(timeoutId);
  }, [viewportRegion]);

  useEffect(() => {
    let cancelled = false;

    async function computePinPositions() {
      if (!mapRef.current || !mapReady || mapSize.width === 0 || mapSize.height === 0) {
        return;
      }

      const nextPositions: Record<number, { x: number; y: number }> = {};

      for (const property of properties) {
        try {
          const point = await mapRef.current.pointForCoordinate({
            latitude: Number(property.latitude),
            longitude: Number(property.longitude),
          });

          if (cancelled) return;

          const label = formatMapPrice(propertyNumericPrice(property));
          const width = pinWidth(label, mapSize.width);
          const clampedX = Math.min(
            Math.max(point.x, width / 2 + 6),
            mapSize.width - width / 2 - 6,
          );
          const clampedY = Math.min(
            Math.max(point.y, 22),
            mapSize.height - 22,
          );

          nextPositions[property.id] = {
            x: clampedX,
            y: clampedY,
          };
        } catch {
          // Ignore coordinates the native map can't project during camera transitions.
        }
      }

      if (!cancelled) {
        setPinPositions(nextPositions);
      }
    }

    const timeoutId = setTimeout(() => {
      void computePinPositions();
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [mapReady, mapSize, properties, queryRegion]);

  function handleMapLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setMapSize({ width, height });
  }

  function openFilters() {
    setDraftPurpose(selectedPurpose);
    setDraftPriceKey(selectedPriceKey);
    setIsFilterModalOpen(true);
  }

  function applyFilters() {
    setSelectedPurpose(draftPurpose);
    setSelectedPriceKey(draftPriceKey);
    setIsFilterModalOpen(false);
  }

  function clearFilters() {
    setDraftPurpose('');
    setDraftPriceKey('all');
  }

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.topbar}>
        <View style={styles.topbarText}>
          <Text style={styles.title}>Imóveis no mapa</Text>
          <Text style={styles.subtitle}>
            {propertiesQuery.isFetching && !propertiesQuery.isLoading
              ? 'Atualizando esta área...'
              : `${properties.length} anúncio(s) nesta área`}
          </Text>
        </View>
      </View>

      {locationError ? <Text style={styles.error}>{locationError}</Text> : null}

      <View style={styles.mapShell} onLayout={handleMapLayout}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onMapReady={() => setMapReady(true)}
          onPress={() => setSelectedPropertyId(null)}
          onRegionChangeComplete={(nextRegion) => {
            setViewportRegion((current) =>
              regionsDiffer(current, nextRegion) ? nextRegion : current,
            );
          }}
          showsUserLocation
          showsMyLocationButton={false}
        />

        <View pointerEvents="box-none" style={styles.mapControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir busca de imóveis"
            onPress={() => router.push('/buscar')}
            style={({ pressed }) => [
              styles.mapSearchPill,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.mapSearchIcon}>
              <Ionicons name="search" size={18} color={colors.white} />
            </View>
            <View style={styles.mapSearchCopy}>
              <Text numberOfLines={1} style={styles.mapSearchTitle}>
                Busca no mapa
              </Text>
              <Text numberOfLines={1} style={styles.mapSearchSubtitle}>
                {mapSearchSubtitle}
              </Text>
            </View>
          </Pressable>

          <View style={styles.mapActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros do mapa"
              onPress={openFilters}
              style={({ pressed }) => [styles.circleAction, pressed && styles.pressed]}
            >
              <Ionicons name="options-outline" size={20} color={colors.text} />
              {activeFilterCount > 0 ? (
                <View style={styles.filterCountBadge}>
                  <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Centralizar na minha localização"
              onPress={() => void useMyLocation()}
              style={({ pressed }) => [styles.circleAction, pressed && styles.pressed]}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <Ionicons name="locate-outline" size={20} color={colors.text} />
              )}
            </Pressable>
          </View>
        </View>

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {properties.map((property) => {
            const point = pinPositions[property.id];

            if (!point) return null;

            const label = formatMapPrice(propertyNumericPrice(property));
            const width = pinWidth(label, mapSize.width);
            const isSelected = property.id === selectedPropertyId;

            return (
              <Pressable
                key={property.id}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar imóvel ${property.title}`}
                onPress={() => setSelectedPropertyId(property.id)}
                style={[
                  styles.pinButton,
                  {
                    width,
                    transform: [
                      { translateX: point.x - width / 2 },
                      { translateY: point.y - 18 },
                    ],
                  },
                  isSelected && styles.pinButtonSelected,
                ]}
              >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={[styles.pinText, isSelected && styles.pinTextSelected]}
              >
                {label}
              </Text>
            </Pressable>
            );
          })}
        </View>

        {propertiesQuery.isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : null}

        {propertiesQuery.isFetching && !propertiesQuery.isLoading ? (
          <View style={styles.fetchingBadge}>
            <ActivityIndicator size="small" color={colors.brand} />
            <Text style={styles.fetchingText}>Atualizando resultados</Text>
          </View>
        ) : null}

        {!propertiesQuery.isLoading && properties.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum anúncio nesta área</Text>
            <Text style={styles.emptyText}>
              Ajuste a finalidade, a faixa de valor ou mova o mapa para ampliar a busca.
            </Text>
          </View>
        ) : null}

        {selectedProperty ? (
          <View style={styles.previewWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/imoveis/[id]',
                  params: { id: String(selectedProperty.id) },
                })
              }
              style={({ pressed }) => [styles.previewCard, pressed && styles.pressed]}
            >
              {imageUrl(selectedProperty) ? (
                <Image
                  source={{ uri: imageUrl(selectedProperty) || undefined }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.previewImage, styles.previewFallback]}>
                  <Text style={styles.previewFallbackText}>Sem foto</Text>
                </View>
              )}

              <View style={styles.previewBody}>
                <View style={styles.previewImageBadgeRow}>
                  <View style={styles.previewImageBadge}>
                    <Ionicons name="sparkles" size={12} color={colors.white} />
                    <Text style={styles.previewImageBadgeText}>Selecionado no mapa</Text>
                  </View>
                  <View style={styles.previewImagePricePill}>
                    <Text style={styles.previewImagePriceText}>{propertyPrice(selectedProperty)}</Text>
                  </View>
                </View>

                <View style={styles.previewTopline}>
                  <Text style={styles.previewBadge}>{purposeLabel(selectedProperty.purpose)}</Text>
                  <View style={styles.previewToplineDot} />
                </View>

                <Text style={styles.previewTitle} numberOfLines={2}>
                  {selectedProperty.title}
                </Text>
                <Text style={styles.previewLocation} numberOfLines={1}>
                  {propertyLocation(selectedProperty) || 'Localização não informada'}
                </Text>

                <View style={styles.previewSpecs}>
                  <Text style={styles.previewSpec}>{selectedProperty.bedrooms ?? 0} qts</Text>
                  <Text style={styles.previewSpec}>{selectedProperty.bathrooms ?? 0} banh</Text>
                  <Text style={styles.previewSpec}>
                    {selectedProperty.area_useful ?? selectedProperty.area_total ?? 0} m²
                  </Text>
                </View>

                <View style={styles.previewCtaRow}>
                  <Text style={styles.previewCta}>Ver detalhes</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.brandDark} />
                </View>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar preview do imóvel"
              onPress={() => setSelectedPropertyId(null)}
              style={({ pressed }) => [styles.previewCloseButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.push('/buscar')}
        style={({ pressed }) => [styles.searchLink, pressed && styles.pressed]}
      >
        <Text style={styles.searchLinkText}>Abrir filtros completos</Text>
      </Pressable>

      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar filtros"
            onPress={() => setIsFilterModalOpen(false)}
            style={styles.modalBackdrop}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros"
                onPress={() => setIsFilterModalOpen(false)}
                style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Finalidade</Text>
                <View style={styles.filterRow}>
                  {purposeFilters.map((item) => {
                    const selected = draftPurpose === item.value;

                    return (
                      <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        onPress={() => setDraftPurpose(item.value)}
                        style={[styles.filterChip, selected && styles.filterChipSelected]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selected && styles.filterChipTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Faixa de valor</Text>
                <View style={styles.filterRow}>
                  {priceRanges.map((item) => {
                    const selected = draftPriceKey === item.key;

                    return (
                      <Pressable
                        key={item.key}
                        accessibilityRole="button"
                        onPress={() => setDraftPriceKey(item.key)}
                        style={[styles.filterChip, selected && styles.filterChipSelected]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selected && styles.filterChipTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                label="Limpar"
                variant="secondary"
                onPress={clearFilters}
                style={styles.modalSecondaryButton}
              />
              <Button
                label="Aplicar filtros"
                onPress={applyFilters}
                style={styles.modalPrimaryButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topbarText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  filterGroup: {
    gap: spacing.sm,
  },
  filterLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: colors.brandDark,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  mapShell: {
    flex: 1,
    minHeight: 700,
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  mapControls: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapSearchPill: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(9,26,46,0.94)',
    ...shadow.card,
  },
  mapSearchIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  mapSearchCopy: {
    flex: 1,
  },
  mapSearchTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  mapSearchSubtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mapActions: {
    gap: spacing.sm,
  },
  circleAction: {
    position: 'relative',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...shadow.card,
  },
  filterCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  filterCountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  pinButton: {
    position: 'absolute',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(16,24,40,0.12)',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  pinButtonSelected: {
    backgroundColor: colors.mapMarker,
    borderColor: colors.mapMarker,
  },
  pinText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  pinTextSelected: {
    color: colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  fetchingBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    ...shadow.card,
  },
  fetchingText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    left: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  previewCard: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: colors.surface,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 10,
  },
  previewWrap: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    left: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 188,
    backgroundColor: colors.surfaceAlt,
  },
  previewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFallbackText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  previewBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  previewImageBadgeRow: {
    marginTop: -30,
    marginRight: 54,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    backgroundColor: colors.mapMarker,
  },
  previewImageBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  previewImagePricePill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  previewImagePriceText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  previewTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewToplineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D5DD',
  },
  previewBadge: {
    color: colors.brandDark,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: '800',
  },
  previewTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  previewLocation: {
    color: colors.textMuted,
    fontSize: 13,
  },
  previewSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  previewSpec: {
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
  },
  previewCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(49,87,255,0.10)',
    paddingVertical: spacing.sm,
    backgroundColor: colors.brandSoft,
  },
  previewCta: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: '900',
  },
  previewCloseButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...shadow.card,
  },
  searchLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  searchLinkText: {
    color: colors.brand,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,24,40,0.34)',
  },
  modalSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D5DD',
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  modalFooter: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalSecondaryButton: {
    flex: 1,
  },
  modalPrimaryButton: {
    flex: 1.4,
  },
});
