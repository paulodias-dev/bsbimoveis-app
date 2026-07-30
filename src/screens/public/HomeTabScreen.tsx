import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { apiClient } from '@/services/apiClient';
import { colors, radius, shadow, spacing } from '@/theme/tokens';
import type {
  PaginatedResponse,
  Property,
  PropertyPurpose,
} from '@/types/api';

const intents: Array<{
  label: string;
  purpose?: PropertyPurpose;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
    { label: 'Comprar', purpose: 'sale', icon: 'home-outline' },
    { label: 'Alugar', purpose: 'rent', icon: 'key-outline' },
    { label: 'Temporada', purpose: 'seasonal', icon: 'sunny-outline' },
  ];

export default function HomeScreen() {
  const [city, setCity] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<PropertyPurpose | ''>('');
  const [cardLayout, setCardLayout] = useState<'list' | 'grid'>('grid');

  const homeQuery = useQuery({
    queryKey: ['home'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Property>>('/properties?per_page=10', {
        auth: false,
      }),
  });

  const properties = homeQuery.data?.data ?? [];
  const propertiesTotal = homeQuery.data?.meta.total ?? properties.length;

  function openSearch(purpose = selectedPurpose) {
    const nextCity = city.trim();

    router.push({
      pathname: '/buscar',
      params: {
        city: nextCity || undefined,
        purpose: purpose || undefined,
      },
    });
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>BSB Imóveis</Text>
            <Text style={styles.heroTitle}>Seu próximo imóvel começa por uma busca simples.</Text>
            <Text style={styles.heroDescription}>
              Encontre opções por cidade, compare no mapa e fale direto com o anunciante sem sair do app.
            </Text>
          </View>

          {/* <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{propertiesTotal}</Text>
              <Text style={styles.heroStatLabel}>anúncios na vitrine</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>Mapa</Text>
              <Text style={styles.heroStatLabel}>comparação por região</Text>
            </View>
          </View> */}
        </View>

        <View style={styles.searchPanel}>
          <View style={styles.searchFieldShell}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Buscar por cidade"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              autoCapitalize="words"
              onSubmitEditing={() => openSearch()}
            />
          </View>

          <View style={styles.intentRow}>
            {intents.map((intent) => {
              const selected = selectedPurpose === intent.purpose;

              return (
                <Pressable
                  key={intent.label}
                  accessibilityRole="button"
                  onPress={() =>
                    setSelectedPurpose((current) =>
                      current === intent.purpose ? '' : (intent.purpose ?? ''),
                    )
                  }
                  style={[styles.intentChip, selected && styles.intentChipSelected]}
                >
                  <Ionicons
                    name={intent.icon}
                    size={15}
                    color={selected ? colors.white : colors.white}
                  />
                  <Text
                    style={[
                      styles.intentChipText,
                      selected && styles.intentChipTextSelected,
                    ]}
                  >
                    {intent.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.heroActions}>
            <Button
              label="Buscar agora"
              onPress={() => openSearch()}
              icon={<Ionicons name="arrow-forward" size={16} color={colors.white} />}
              style={styles.heroPrimaryButton}
            />
            {/* <Button
              label="Ver no mapa"
              variant="secondary"
              onPress={() => router.push('/ver-no-mapa')}
              icon={<Ionicons name="map-outline" size={16} color={colors.brandDark} />}
              style={styles.heroSecondaryButton}
            /> */}
          </View>
        </View>
      </View>

      <Card style={styles.mapCard}>
        <View style={styles.mapCardCopy}>
          <Text style={styles.mapCardTitle}>Prefere explorar por região?</Text>
          <Text style={styles.mapCardDescription}>
            Veja preços direto no mapa e abra o preview do imóvel antes de entrar no detalhe.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/ver-no-mapa')}
          style={({ pressed }) => [styles.mapCardAction, pressed && styles.pressed]}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.white} />
          <Text style={styles.mapCardActionText}>Abrir mapa</Text>
        </Pressable>
      </Card>

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
        <View style={styles.section}>
          <View style={styles.sectionTopbar}>
            <PageHeader
              eyebrow="Vitrine"
              title="Imóveis recentes"
              description="Escolha como prefere navegar pelos anúncios e toque no card para ver mais."
            />

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
                <Text
                  style={[
                    styles.layoutOptionText,
                    cardLayout === 'grid' && styles.layoutOptionTextSelected,
                  ]}
                >
                  Grade
                </Text>
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
                <Text
                  style={[
                    styles.layoutOptionText,
                    cardLayout === 'list' && styles.layoutOptionTextSelected,
                  ]}
                >
                  Lista
                </Text>
              </Pressable>

            </View>
          </View>

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

          <Button
            label="Abrir busca completa"
            variant="secondary"
            onPress={() => openSearch()}
            icon={<Ionicons name="search-outline" size={16} color={colors.brandDark} />}
          />
        </View>
      )}
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
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(84,120,255,0.30)',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -70,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(33,59,199,0.22)',
  },
  heroHeader: {
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.md,
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
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '900',
  },
  heroDescription: {
    color: '#D0D5DD',
    fontSize: 15,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroStat: {
    gap: 2,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: '#D0D5DD',
    fontSize: 11,
    fontWeight: '700',
  },
  heroDivider: {
    width: 1,
    height: 34,
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  searchPanel: {
    gap: spacing.md,
    borderRadius: 24,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  searchFieldShell: {
    minHeight: 54,
    borderRadius: 18,
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
  intentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  intentChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  intentChipSelected: {
    backgroundColor: colors.white,
  },
  intentChipText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  intentChipTextSelected: {
    color: colors.brandDark,
  },
  heroActions: {
    gap: spacing.sm,
  },
  heroPrimaryButton: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  heroSecondaryButton: {
    backgroundColor: colors.white,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  mapCard: {
    padding: spacing.lg,
    borderRadius: 26,
    gap: spacing.md,
    backgroundColor: '#EEF4FF',
    borderColor: '#D7E3FF',
  },
  mapCardCopy: {
    gap: spacing.xs,
  },
  mapCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  mapCardDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  mapCardAction: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brandDark,
    ...shadow.card,
  },
  mapCardActionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    gap: spacing.lg,
  },
  sectionTopbar: {
    gap: spacing.md,
  },
  layoutToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.pill,
    padding: 4,
    backgroundColor: colors.surfaceAlt,
  },
  layoutOption: {
    minWidth: 58,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  layoutOptionSelected: {
    backgroundColor: colors.white,
    ...shadow.card,
  },
  layoutOptionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  layoutOptionTextSelected: {
    color: colors.brandDark,
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
});
