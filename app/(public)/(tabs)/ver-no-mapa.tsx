import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { apiClient } from '@/services/apiClient';
import { colors, radius, spacing } from '@/theme/tokens';
import type { PaginatedResponse, Property } from '@/types/api';
import { formatCurrency } from '@/utils/format';

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

export default function MapScreen() {
  const [region, setRegion] = useState<Region>(initialRegion);
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

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

      <View style={styles.mapShell}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          region={mapRegion}
          onRegionChangeComplete={(nextRegion) => {
            setMapRegion(nextRegion);
            setRegion(nextRegion);
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {properties.map((property) => {
            const value =
              property.purpose === 'rent'
                ? property.price_rent
                : property.purpose === 'seasonal'
                  ? property.price_seasonal_daily
                  : property.price_sale;

            return (
              <Marker
                key={property.id}
                coordinate={{
                  latitude: Number(property.latitude),
                  longitude: Number(property.longitude),
                }}
                onCalloutPress={() =>
                  router.push({
                    pathname: '/imoveis/[id]',
                    params: { id: String(property.id) },
                  })
                }
                title={property.title}
                description="Toque para abrir os detalhes"
              >
                <View style={styles.marker}>
                  <Text style={styles.markerText}>{formatCurrency(value)}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

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
  marker: {
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.mapMarker,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  markerText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
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
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
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
  searchLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  searchLinkText: {
    color: colors.brand,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.65,
  },
});
