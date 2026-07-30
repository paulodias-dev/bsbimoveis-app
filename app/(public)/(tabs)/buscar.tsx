import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { getPropertyCategories } from '@/features/properties/propertyService';
import { apiClient } from '@/services/apiClient';
import { colors, radius, shadow, spacing } from '@/theme/tokens';
import type {
  PaginatedResponse,
  Property,
  PropertyCategory,
  PropertyPurpose,
} from '@/types/api';
import { formatCurrency } from '@/utils/format';

const purposes: Array<{ value: PropertyPurpose | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'sale', label: 'Comprar' },
  { value: 'rent', label: 'Alugar' },
  { value: 'seasonal', label: 'Temporada' },
];

const bedroomOptions = [
  { value: '', label: 'Qualquer' },
  { value: '1', label: '1+ quarto' },
  { value: '2', label: '2+ quartos' },
  { value: '3', label: '3+ quartos' },
  { value: '4', label: '4+ quartos' },
] as const;

const pricePresets = [
  { key: 'all', label: 'Qualquer valor', min: '', max: '' },
  { key: 'starter', label: 'Até R$ 300 mil', min: '', max: '300000' },
  { key: 'mid', label: 'R$ 300 mil a R$ 700 mil', min: '300000', max: '700000' },
  { key: 'upper', label: 'R$ 700 mil a R$ 1 mi', min: '700000', max: '1000000' },
  { key: 'prime', label: 'Acima de R$ 1 mi', min: '1000000', max: '' },
] as const;

interface SearchFilters {
  city: string;
  state: string;
  purpose: PropertyPurpose | '';
  categoryId: string;
  bedroomsMin: string;
  minPrice: string;
  maxPrice: string;
}

function normalizePurpose(value: string | undefined): PropertyPurpose | '' {
  if (value === 'sale' || value === 'rent' || value === 'seasonal') {
    return value;
  }

  return '';
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function formatPriceInput(value: string) {
  if (!value) return '';
  return Number(value).toLocaleString('pt-BR');
}

function buildInitialFilters(params: { city?: string; purpose?: string }): SearchFilters {
  return {
    city: params.city?.trim() ?? '',
    state: '',
    purpose: normalizePurpose(params.purpose),
    categoryId: '',
    bedroomsMin: '',
    minPrice: '',
    maxPrice: '',
  };
}

function sanitizeFilters(filters: SearchFilters): SearchFilters {
  return {
    city: filters.city.trim(),
    state: filters.state.trim().toUpperCase(),
    purpose: filters.purpose,
    categoryId: digitsOnly(filters.categoryId),
    bedroomsMin: digitsOnly(filters.bedroomsMin),
    minPrice: digitsOnly(filters.minPrice),
    maxPrice: digitsOnly(filters.maxPrice),
  };
}

function selectedPresetKey(filters: Pick<SearchFilters, 'minPrice' | 'maxPrice'>) {
  const preset = pricePresets.find(
    (item) => item.min === filters.minPrice && item.max === filters.maxPrice,
  );

  return preset?.key ?? null;
}

function priceRangeLabel(filters: Pick<SearchFilters, 'minPrice' | 'maxPrice'>) {
  if (!filters.minPrice && !filters.maxPrice) {
    return '';
  }

  if (filters.minPrice && filters.maxPrice) {
    return `${formatCurrency(Number(filters.minPrice))} a ${formatCurrency(Number(filters.maxPrice))}`;
  }

  if (filters.minPrice) {
    return `A partir de ${formatCurrency(Number(filters.minPrice))}`;
  }

  return `Até ${formatCurrency(Number(filters.maxPrice))}`;
}

function countActiveFilters(filters: SearchFilters) {
  return [
    filters.city,
    filters.state,
    filters.purpose,
    filters.categoryId,
    filters.bedroomsMin,
    filters.minPrice || filters.maxPrice ? 'price' : '',
  ].filter(Boolean).length;
}

function buildQueryString(filters: SearchFilters) {
  const params = new URLSearchParams({ per_page: '24' });

  if (filters.city) params.set('city', filters.city);
  if (filters.state) params.set('state', filters.state);
  if (filters.purpose) params.set('purpose', filters.purpose);
  if (filters.categoryId) params.set('category_id', filters.categoryId);
  if (filters.bedroomsMin) params.set('bedrooms_min', filters.bedroomsMin);
  if (filters.minPrice) params.set('min_price', filters.minPrice);
  if (filters.maxPrice) params.set('max_price', filters.maxPrice);

  return params.toString();
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ city?: string; purpose?: string }>();
  const initialFilters = useMemo(
    () => buildInitialFilters(params),
    [params.city, params.purpose],
  );

  const [cityInput, setCityInput] = useState(initialFilters.city);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(initialFilters);
  const [cardLayout, setCardLayout] = useState<'list' | 'grid'>('grid');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    setCityInput(initialFilters.city);
    setFilters(initialFilters);
    setDraftFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedCity = cityInput.trim();
      setFilters((current) =>
        current.city === trimmedCity ? current : { ...current, city: trimmedCity },
      );
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [cityInput]);

  const queryString = useMemo(() => buildQueryString(filters), [filters]);
  const activeFiltersCount = countActiveFilters(filters);
  const priceValidationError =
    draftFilters.minPrice &&
    draftFilters.maxPrice &&
    Number(draftFilters.minPrice) > Number(draftFilters.maxPrice)
      ? 'O valor máximo precisa ser maior que o mínimo.'
      : '';

  const categoriesQuery = useQuery({
    queryKey: ['property-categories'],
    queryFn: () => getPropertyCategories(),
    staleTime: 1000 * 60 * 10,
  });

  const searchQuery = useQuery({
    queryKey: ['property-search', queryString],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Property>>(`/properties?${queryString}`, {
        auth: false,
      }),
    placeholderData: (previousData) => previousData,
  });

  const properties = searchQuery.data?.data ?? [];
  const totalResults = searchQuery.data?.meta.total ?? properties.length;
  const categories = categoriesQuery.data?.data ?? [];
  const selectedCategory = categories.find(
    (item) => String(item.id) === filters.categoryId,
  );

  function openAdvancedFilters() {
    setDraftFilters(filters);
    setIsAdvancedOpen(true);
  }

  function closeAdvancedFilters() {
    setDraftFilters(filters);
    setIsAdvancedOpen(false);
  }

  function applyAdvancedFilters() {
    if (priceValidationError) return;

    const nextFilters = sanitizeFilters({
      ...filters,
      state: draftFilters.state,
      categoryId: draftFilters.categoryId,
      bedroomsMin: draftFilters.bedroomsMin,
      minPrice: draftFilters.minPrice,
      maxPrice: draftFilters.maxPrice,
    });

    setFilters(nextFilters);
    setIsAdvancedOpen(false);
  }

  function clearAdvancedFilters() {
    setDraftFilters((current) => ({
      ...current,
      state: '',
      categoryId: '',
      bedroomsMin: '',
      minPrice: '',
      maxPrice: '',
    }));
  }

  function togglePurpose(nextPurpose: PropertyPurpose | '') {
    setFilters((current) => ({
      ...current,
      purpose: current.purpose === nextPurpose ? '' : nextPurpose,
    }));
  }

  function removeFilterChip(key: 'city' | 'state' | 'purpose' | 'categoryId' | 'bedroomsMin' | 'price') {
    if (key === 'city') {
      setCityInput('');
      setFilters((current) => ({ ...current, city: '' }));
      return;
    }

    if (key === 'state') {
      setFilters((current) => ({ ...current, state: '' }));
      return;
    }

    if (key === 'purpose') {
      setFilters((current) => ({ ...current, purpose: '' }));
      return;
    }

    if (key === 'categoryId') {
      setFilters((current) => ({ ...current, categoryId: '' }));
      return;
    }

    if (key === 'bedroomsMin') {
      setFilters((current) => ({ ...current, bedroomsMin: '' }));
      return;
    }

    setFilters((current) => ({ ...current, minPrice: '', maxPrice: '' }));
  }

  const activeFilterChips = [
    filters.city ? { key: 'city' as const, label: filters.city } : null,
    filters.state ? { key: 'state' as const, label: filters.state } : null,
    filters.purpose
      ? {
          key: 'purpose' as const,
          label: purposes.find((item) => item.value === filters.purpose)?.label ?? 'Finalidade',
        }
      : null,
    selectedCategory
      ? { key: 'categoryId' as const, label: selectedCategory.name }
      : null,
    filters.bedroomsMin
      ? { key: 'bedroomsMin' as const, label: `${filters.bedroomsMin}+ quartos` }
      : null,
    priceRangeLabel(filters)
      ? { key: 'price' as const, label: priceRangeLabel(filters) }
      : null,
  ].filter(Boolean) as Array<{ key: 'city' | 'state' | 'purpose' | 'categoryId' | 'bedroomsMin' | 'price'; label: string }>;

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Busca inteligente</Text>
          <Text style={styles.heroTitle}>Encontre mais rápido o imóvel certo.</Text>
          <Text style={styles.heroDescription}>
            Os filtros principais reagem automaticamente e os filtros avançados ficam a um toque de distância.
          </Text>
        </View>

        <View style={styles.searchPanel}>
          <View style={styles.searchInputShell}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="Busque por cidade"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="words"
              returnKeyType="search"
            />
          </View>

          <View style={styles.searchActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros avançados"
              onPress={openAdvancedFilters}
              style={({ pressed }) => [
                styles.circleAction,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="options-outline" size={18} color={colors.text} />
              {activeFiltersCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver imóveis no mapa"
              onPress={() => router.push('/ver-no-mapa')}
              style={({ pressed }) => [
                styles.circleAction,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="map-outline" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.quickFilterRow}>
          {purposes.map((item) => {
            const selected = item.value === filters.purpose;

            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={() => togglePurpose(item.value)}
                style={[styles.quickChip, selected && styles.quickChipSelected]}
              >
                <Text
                  style={[styles.quickChipText, selected && styles.quickChipTextSelected]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.heroFooter}>
          <View style={styles.heroStatus}>
            {searchQuery.isFetching ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="sparkles" size={15} color={colors.white} />
            )}
            <Text style={styles.heroStatusText}>
              {searchQuery.isFetching
                ? 'Atualizando resultados...'
                : `${totalResults} imóvel(is) encontrado(s)`}
            </Text>
          </View>

          {/* <Text style={styles.heroHint}>Busca reativa, sem botão de aplicar.</Text> */}
        </View>
      </View>

      {activeFilterChips.length > 0 ? (
        <View style={styles.activeFiltersCard}>
          <View style={styles.activeFiltersHeader}>
            <Text style={styles.activeFiltersTitle}>Filtros ativos</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setCityInput('');
                setFilters({
                  city: '',
                  state: '',
                  purpose: '',
                  categoryId: '',
                  bedroomsMin: '',
                  minPrice: '',
                  maxPrice: '',
                });
              }}
            >
              <Text style={styles.clearText}>Limpar tudo</Text>
            </Pressable>
          </View>

          <View style={styles.activeFiltersRow}>
            {activeFilterChips.map((item) => (
              <Pressable
                key={`${item.key}-${item.label}`}
                accessibilityRole="button"
                onPress={() => removeFilterChip(item.key)}
                style={({ pressed }) => [
                  styles.activeChip,
                  pressed && styles.pressed,
                ]}
              >
                <Text numberOfLines={1} style={styles.activeChipText}>
                  {item.label}
                </Text>
                <Ionicons name="close" size={14} color={colors.brandDark} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.resultsSection}>
        <View style={styles.resultsTopbar}>
          <View style={styles.resultsCopy}>
            <Text style={styles.resultsTitle}>Resultados da busca</Text>
            <Text style={styles.resultCount}>
              {searchQuery.isFetching && !searchQuery.isLoading
                ? 'Atualizando sua seleção'
                : `${totalResults} anúncio(s) encontrado(s)`}
            </Text>
          </View>

          <View style={styles.layoutToggle}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setCardLayout('grid')}
              style={[
                styles.layoutOption,
                cardLayout === 'grid' && styles.layoutOptionSelected,
              ]}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={cardLayout === 'grid' ? colors.brandDark : colors.textMuted}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setCardLayout('list')}
              style={[
                styles.layoutOption,
                cardLayout === 'list' && styles.layoutOptionSelected,
              ]}
            >
              <Ionicons
                name="reorder-two-outline"
                size={16}
                color={cardLayout === 'list' ? colors.brandDark : colors.textMuted}
              />
            </Pressable>
          </View>
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
        ) : properties.length === 0 ? (
          <StateView
            title="Nenhum imóvel encontrado"
            description="Ajuste cidade, finalidade ou abra os filtros avançados para ampliar a busca."
          />
        ) : (
          <View style={cardLayout === 'grid' ? styles.grid : styles.list}>
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                layout={cardLayout}
                style={cardLayout === 'grid' ? styles.gridItem : undefined}
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
      </View>

      <Modal
        visible={isAdvancedOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeAdvancedFilters}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar filtros avançados"
            onPress={closeAdvancedFilters}
            style={styles.modalBackdrop}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros avançados</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros avançados"
                onPress={closeAdvancedFilters}
                style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Região</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Estado</Text>
                  <TextInput
                    value={draftFilters.state}
                    onChangeText={(value) =>
                      setDraftFilters((current) => ({ ...current, state: value }))
                    }
                    placeholder="Ex.: DF"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    maxLength={2}
                    style={styles.modalInput}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tipo de imóvel</Text>
                {categoriesQuery.isLoading ? (
                  <View style={styles.inlineLoading}>
                    <ActivityIndicator size="small" color={colors.brand} />
                    <Text style={styles.inlineLoadingText}>Carregando categorias...</Text>
                  </View>
                ) : categoriesQuery.error ? (
                  <Text style={styles.inlineErrorText}>
                    Não foi possível carregar as categorias agora.
                  </Text>
                ) : (
                  <View style={styles.chipWrap}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setDraftFilters((current) => ({ ...current, categoryId: '' }))
                      }
                      style={[
                        styles.optionChip,
                        !draftFilters.categoryId && styles.optionChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          !draftFilters.categoryId && styles.optionChipTextSelected,
                        ]}
                      >
                        Todos
                      </Text>
                    </Pressable>

                    {categories.map((item: PropertyCategory) => {
                      const selected = draftFilters.categoryId === String(item.id);

                      return (
                        <Pressable
                          key={item.id}
                          accessibilityRole="button"
                          onPress={() =>
                            setDraftFilters((current) => ({
                              ...current,
                              categoryId: selected ? '' : String(item.id),
                            }))
                          }
                          style={[
                            styles.optionChip,
                            selected && styles.optionChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              selected && styles.optionChipTextSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Quartos mínimos</Text>
                <View style={styles.chipWrap}>
                  {bedroomOptions.map((item) => {
                    const selected = draftFilters.bedroomsMin === item.value;

                    return (
                      <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        onPress={() =>
                          setDraftFilters((current) => ({
                            ...current,
                            bedroomsMin: item.value,
                          }))
                        }
                        style={[
                          styles.optionChip,
                          selected && styles.optionChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            selected && styles.optionChipTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Faixa de valor</Text>
                <View style={styles.chipWrap}>
                  {pricePresets.map((item) => {
                    const selected = selectedPresetKey(draftFilters) === item.key;

                    return (
                      <Pressable
                        key={item.key}
                        accessibilityRole="button"
                        onPress={() =>
                          setDraftFilters((current) => ({
                            ...current,
                            minPrice: item.min,
                            maxPrice: item.max,
                          }))
                        }
                        style={[
                          styles.optionChip,
                          selected && styles.optionChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            selected && styles.optionChipTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.priceFieldsRow}>
                  <View style={[styles.fieldGroup, styles.priceField]}>
                    <Text style={styles.fieldLabel}>Valor mínimo</Text>
                    <TextInput
                      value={formatPriceInput(draftFilters.minPrice)}
                      onChangeText={(value) =>
                        setDraftFilters((current) => ({
                          ...current,
                          minPrice: digitsOnly(value),
                        }))
                      }
                      placeholder="R$ 0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      style={styles.modalInput}
                    />
                  </View>

                  <View style={[styles.fieldGroup, styles.priceField]}>
                    <Text style={styles.fieldLabel}>Valor máximo</Text>
                    <TextInput
                      value={formatPriceInput(draftFilters.maxPrice)}
                      onChangeText={(value) =>
                        setDraftFilters((current) => ({
                          ...current,
                          maxPrice: digitsOnly(value),
                        }))
                      }
                      placeholder="Sem limite"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      style={styles.modalInput}
                    />
                  </View>
                </View>

                {priceValidationError ? (
                  <Text style={styles.validationText}>{priceValidationError}</Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                label="Limpar"
                variant="secondary"
                onPress={clearAdvancedFilters}
                style={styles.modalSecondaryButton}
              />
              <Button
                label="Mostrar imóveis"
                onPress={applyAdvancedFilters}
                disabled={Boolean(priceValidationError)}
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
  hero: {
    overflow: 'hidden',
    borderRadius: 30,
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.mapMarker,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -52,
    right: -28,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(90,132,255,0.26)',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -88,
    left: -44,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(28,49,138,0.24)',
  },
  heroCopy: {
    gap: spacing.sm,
  },
  kicker: {
    color: '#C7D2FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
  },
  heroDescription: {
    color: '#D0D5DD',
    fontSize: 15,
    lineHeight: 22,
  },
  searchPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInputShell: {
    flex: 1,
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  searchActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  circleAction: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    ...shadow.card,
  },
  filterBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mapMarker,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  quickFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  quickChipSelected: {
    backgroundColor: colors.white,
  },
  quickChipText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  quickChipTextSelected: {
    color: colors.brandDark,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  heroStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroStatusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  heroHint: {
    color: '#D0D5DD',
    fontSize: 12,
    fontWeight: '700',
  },
  activeFiltersCard: {
    gap: spacing.sm,
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D8E4FF',
    backgroundColor: '#F7FAFF',
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  activeFiltersTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  clearText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '800',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  activeChip: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#E6EEFF',
  },
  activeChipText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: '700',
  },
  resultsSection: {
    gap: spacing.lg,
  },
  resultsTopbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  resultsCopy: {
    flex: 1,
    gap: 4,
  },
  resultsTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  layoutToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.pill,
    padding: 4,
    backgroundColor: colors.surfaceAlt,
  },
  layoutOption: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutOptionSelected: {
    backgroundColor: colors.white,
    ...shadow.card,
  },
  list: {
    gap: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '48%',
  },
  pressed: {
    opacity: 0.88,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(16,24,40,0.34)',
  },
  modalSheet: {
    maxHeight: '82%',
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
  filterSection: {
    gap: spacing.md,
  },
  filterSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  modalInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineLoadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  inlineErrorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionChipSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  optionChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  optionChipTextSelected: {
    color: colors.brandDark,
  },
  priceFieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceField: {
    flex: 1,
  },
  validationText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
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
