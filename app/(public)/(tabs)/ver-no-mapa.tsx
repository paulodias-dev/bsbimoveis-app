import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { apiClient } from '@/services/apiClient';
import { colors, radius, shadow, spacing } from '@/theme/tokens';
import type { PaginatedResponse, Property } from '@/types/api';
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

function pinWidth(label: string): number {
  return Math.max(84, Math.min(164, 26 + label.length * 8.5));
}

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>(initialRegion);
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [pinPositions, setPinPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});

  const queryString = useMemo(() => {
    const bounds = regionToBounds(region);
    return new URLSearchParams({
      per_page: '60',
      sw_lat: bounds.sw_lat.toFixed(6),
      sw_lng: bounds.sw_lng.toFixed(6),
      ne_lat: bounds.ne_lat.toFixed(6),
      ne_lng: bounds.ne_lng.toFixed(6),
    }).toString();
  }, [region]);

  const propertiesQuery = useQuery({
    queryKey: ['map-properties', queryString],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Property>>(`/properties?${queryString}`, {
        auth: false,
      }),
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

      setMapRegion(nextRegion);
      setRegion(nextRegion);
    } catch {
      setLocationError('Não foi possível obter sua localização.');
    } finally {
      setIsLocating(false);
    }
  }

  const properties = propertiesQuery.data?.data.filter(
    (property) =>
      property.latitude !== null &&
      property.longitude !== null &&
      Number.isFinite(Number(property.latitude)) &&
      Number.isFinite(Number(property.longitude)),
  ) ?? [];

  const selectedProperty =
    properties.find((property) => property.id === selectedPropertyId) ?? null;

  useEffect(() => {
    if (selectedPropertyId === null) return;
    if (!properties.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(null);
    }
  }, [properties, selectedPropertyId]);

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
          const width = pinWidth(label);
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
  }, [mapReady, mapSize, properties, mapRegion]);

  function handleMapLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setMapSize({ width, height });
  }

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.topbar}>
        <View style={styles.topbarText}>
          <Text style={styles.title}>Imóveis no mapa</Text>
          <Text style={styles.subtitle}>
            {propertiesQuery.isFetching
              ? 'Atualizando esta área...'
              : `${propertiesQuery.data?.meta.total ?? properties.length} anúncio(s) nesta área`}
          </Text>
        </View>
        <Button
          label={isLocating ? 'Localizando...' : 'Minha localização'}
          variant="secondary"
          loading={isLocating}
          onPress={() => void useMyLocation()}
          style={styles.locationButton}
        />
      </View>

      {locationError ? <Text style={styles.error}>{locationError}</Text> : null}

      <View style={styles.mapShell} onLayout={handleMapLayout}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          region={mapRegion}
          onMapReady={() => setMapReady(true)}
          onPress={() => setSelectedPropertyId(null)}
          onRegionChangeComplete={(nextRegion) => {
            setMapRegion(nextRegion);
            setRegion(nextRegion);
          }}
          showsUserLocation
          showsMyLocationButton={false}
        />

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {properties.map((property) => {
            const point = pinPositions[property.id];

            if (!point) return null;

            const label = formatMapPrice(propertyNumericPrice(property));
            const width = pinWidth(label);
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
                <Text style={[styles.pinText, isSelected && styles.pinTextSelected]}>
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

        {!propertiesQuery.isLoading && properties.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum anúncio nesta área</Text>
            <Text style={styles.emptyText}>Mova ou afaste o mapa para ampliar a busca.</Text>
          </View>
        ) : null}

        {selectedProperty ? (
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
        ) : null}
      </View>

      <Pressable
        onPress={() => router.push('/buscar')}
        style={({ pressed }) => [styles.searchLink, pressed && styles.pressed]}
      >
        <Text style={styles.searchLinkText}>Abrir filtros completos</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  locationButton: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  mapShell: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
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
    fontSize: 10,
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
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    left: spacing.md,
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
    padding: spacing.md,
    gap: spacing.sm,
  },
  previewImageBadgeRow: {
    marginTop: -30,
    marginBottom: 2,
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
    fontSize: 20,
    lineHeight: 25,
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
});
