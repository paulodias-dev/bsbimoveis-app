import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, radius, spacing } from '@/theme/tokens';
import { geocodeAddress, lookupPostalCode } from '../../addressService';
import { FormTextField } from '../FormTextField';
import type { PropertyFormValues } from '../schema';

interface AddressStepProps {
  onFeedback: (message: string | null, tone?: 'success' | 'error') => void;
}

const fallbackRegion: Region = {
  latitude: -15.793889,
  longitude: -47.882778,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export function AddressStep({ onFeedback }: AddressStepProps) {
  const { control, getValues, setValue, clearErrors } = useFormContext<PropertyFormValues>();
  const postalCode = useWatch({ control, name: 'postal_code' });
  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const lastCepRef = useRef('');

  const coordinate = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { latitude: fallbackRegion.latitude, longitude: fallbackRegion.longitude };
    }
    return { latitude: lat, longitude: lng };
  }, [latitude, longitude]);

  const [mapRegion, setMapRegion] = useState<Region>({
    ...fallbackRegion,
    ...coordinate,
  });

  useEffect(() => {
    setMapRegion((current) => ({ ...current, ...coordinate }));
  }, [coordinate]);

  async function locateCurrentAddress() {
    const values = getValues();
    setIsGeocoding(true);
    onFeedback(null);

    try {
      const geocoded = await geocodeAddress({
        postal_code: values.postal_code,
        address_line: values.address_line,
        address_number: values.address_number,
        neighborhood: values.neighborhood,
        city: values.city,
        state: values.state,
      });

      setValue('latitude', geocoded.latitude.toFixed(6), { shouldDirty: true });
      setValue('longitude', geocoded.longitude.toFixed(6), { shouldDirty: true });
      clearErrors(['latitude', 'longitude']);
      setMapRegion({
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      onFeedback('Endereço localizado. Arraste o pino para ajustar a posição.', 'success');
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Não foi possível localizar o endereço.',
        'error',
      );
    } finally {
      setIsGeocoding(false);
    }
  }

  useEffect(() => {
    const digits = postalCode.replace(/\D/g, '');
    if (digits.length !== 8 || digits === lastCepRef.current) return;

    const timer = setTimeout(() => {
      void (async () => {
        setIsLookingUpCep(true);
        onFeedback(null);
        try {
          const address = await lookupPostalCode(digits);
          setValue('postal_code', address.postalCode, { shouldDirty: true });
          if (address.street) setValue('address_line', address.street, { shouldDirty: true });
          if (address.neighborhood) {
            setValue('neighborhood', address.neighborhood, { shouldDirty: true });
          }
          if (address.city) setValue('city', address.city, { shouldDirty: true });
          if (address.state) setValue('state', address.state, { shouldDirty: true });
          lastCepRef.current = digits;
          onFeedback('CEP encontrado. Confira o número e localize no mapa.', 'success');
        } catch (error) {
          onFeedback(
            error instanceof Error ? error.message : 'Não foi possível consultar o CEP.',
            'error',
          );
        } finally {
          setIsLookingUpCep(false);
        }
      })();
    }, 450);

    return () => clearTimeout(timer);
  }, [onFeedback, postalCode, setValue]);

  return (
    <View style={styles.container}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Endereço</Text>
        <FormTextField
          name="postal_code"
          label="CEP"
          placeholder="00000-000"
          keyboardType="numeric"
          hint={isLookingUpCep ? 'Consultando CEP...' : 'O endereço será preenchido automaticamente.'}
        />
        <FormTextField
          name="address_line"
          label="Logradouro"
          placeholder="Rua, avenida ou quadra"
          autoCapitalize="words"
        />
        <FormTextField
          name="address_number"
          label="Número"
          placeholder="Ex.: 120 ou S/N"
          autoCapitalize="characters"
        />
        <FormTextField
          name="neighborhood"
          label="Bairro"
          placeholder="Ex.: Asa Norte"
          autoCapitalize="words"
        />
        <View style={styles.twoColumns}>
          <View style={styles.cityColumn}>
            <FormTextField
              name="city"
              label="Cidade"
              placeholder="Brasília"
              autoCapitalize="words"
            />
          </View>
          <View style={styles.stateColumn}>
            <FormTextField
              name="state"
              label="UF"
              placeholder="DF"
              autoCapitalize="characters"
            />
          </View>
        </View>
        <Button
          label={isGeocoding ? 'Localizando...' : 'Localizar endereço no mapa'}
          variant="secondary"
          loading={isGeocoding}
          onPress={() => void locateCurrentAddress()}
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderText}>
            <Text style={styles.sectionTitle}>Posição do imóvel</Text>
            <Text style={styles.sectionHint}>Arraste o pino para corrigir a localização.</Text>
          </View>
        </View>
        <View style={styles.mapShell}>
          <MapView
            style={StyleSheet.absoluteFill}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            <Marker
              coordinate={coordinate}
              draggable
              onDragEnd={(event) => {
                const next = event.nativeEvent.coordinate;
                setValue('latitude', next.latitude.toFixed(6), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue('longitude', next.longitude.toFixed(6), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                clearErrors(['latitude', 'longitude']);
              }}
            />
          </MapView>
        </View>
        <Text style={styles.coordinates}>
          Coordenadas: {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  sectionHint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  twoColumns: { flexDirection: 'row', gap: spacing.sm },
  cityColumn: { flex: 1 },
  stateColumn: { width: 86 },
  mapHeader: { flexDirection: 'row', alignItems: 'center' },
  mapHeaderText: { flex: 1 },
  mapShell: {
    height: 280,
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  coordinates: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
