import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { TextField } from '@/components/ui/TextField';
import { apiClient } from '@/services/apiClient';
import { colors, radius, spacing } from '@/theme/tokens';
import type {
  PaginatedResponse,
  Property,
  PropertyPurpose,
} from '@/types/api';

const purposes: Array<{ value: PropertyPurpose | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'sale', label: 'Comprar' },
  { value: 'rent', label: 'Alugar' },
  { value: 'seasonal', label: 'Temporada' },
];

function normalizePurpose(value: string | undefined): PropertyPurpose | '' {
  if (value === 'sale' || value === 'rent' || value === 'seasonal') {
    return value;
  }

  return '';
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ city?: string; purpose?: string }>();
  const initialCity = params.city?.trim() ?? '';
  const initialPurpose = normalizePurpose(params.purpose);
  const [city, setCity] = useState(initialCity);
  const [purpose, setPurpose] = useState<PropertyPurpose | ''>(initialPurpose);
  const [applied, setApplied] = useState({
    city: initialCity,
    purpose: initialPurpose,
  });

  useEffect(() => {
    const nextCity = params.city?.trim() ?? '';
    const nextPurpose = normalizePurpose(params.purpose);

    setCity(nextCity);
    setPurpose(nextPurpose);
    setApplied({ city: nextCity, purpose: nextPurpose });
  }, [params.city, params.purpose]);

  const searchQuery = useQuery({
    queryKey: ['properties', applied],
    queryFn: () => {
      const params = new URLSearchParams({ per_page: '20' });
      if (applied.city) params.set('city', applied.city);
      if (applied.purpose) params.set('purpose', applied.purpose);

      return apiClient.get<PaginatedResponse<Property>>(
        `/properties?${params.toString()}`,
        { auth: false },
      );
    },
  });

  return (
    <Screen>
      <PageHeader
        eyebrow="Busca"
        title="Encontre o imóvel certo"
        description="Esta primeira versão já consulta os filtros reais da API."
      />

      <View style={styles.filters}>
        <TextField
          label="Cidade"
          value={city}
          placeholder="Ex.: Brasília"
          onChangeText={setCity}
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={() => setApplied({ city: city.trim(), purpose })}
        />

        <View style={styles.purposeRow}>
          {purposes.map((item) => {
            const selected = item.value === purpose;
            return (
              <Pressable
                key={item.label}
                onPress={() => setPurpose(item.value)}
                style={[styles.purpose, selected && styles.purposeSelected]}
              >
                <Text style={[styles.purposeText, selected && styles.purposeTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Aplicar filtros"
          onPress={() => setApplied({ city: city.trim(), purpose })}
        />
      </View>

      {searchQuery.isLoading ? (
        <StateView title="Buscando imóveis..." loading />
      ) : searchQuery.error ? (
        <StateView
          title="Falha ao buscar imóveis"
          description={searchQuery.error.message}
          actionLabel="Tentar novamente"
          onAction={() => void searchQuery.refetch()}
        />
      ) : (searchQuery.data?.data.length ?? 0) === 0 ? (
        <StateView
          title="Nenhum imóvel encontrado"
          description="Altere a cidade ou a finalidade para ampliar a busca."
        />
      ) : (
        <View style={styles.results}>
          <Text style={styles.resultCount}>
            {searchQuery.data?.meta.total ?? 0} anúncio(s) encontrado(s)
          </Text>
          {(searchQuery.data?.data ?? []).map((property) => (
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
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: spacing.md,
  },
  purposeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  purpose: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  purposeSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  purposeText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  purposeTextSelected: {
    color: colors.brandDark,
  },
  results: {
    gap: spacing.lg,
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
