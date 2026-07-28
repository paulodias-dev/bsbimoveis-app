import { Controller, useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { Amenity } from '@/types/api';
import { colors, radius, spacing } from '@/theme/tokens';
import type { PropertyFormValues } from '../schema';

interface AmenitiesStepProps {
  amenities: Amenity[];
}

export function AmenitiesStep({ amenities }: AmenitiesStepProps) {
  const { control } = useFormContext<PropertyFormValues>();

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Comodidades e diferenciais</Text>
      <Text style={styles.description}>
        Selecione os itens que ajudam o interessado a comparar este imóvel.
      </Text>

      <Controller
        control={control}
        name="amenity_ids"
        render={({ field: { value, onChange } }) => (
          <View style={styles.grid}>
            {amenities.map((amenity) => {
              const selected = value.includes(amenity.id);
              return (
                <Pressable
                  key={amenity.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() =>
                    onChange(
                      selected
                        ? value.filter((id) => id !== amenity.id)
                        : [...value, amenity.id],
                    )
                  }
                  style={[styles.item, selected && styles.itemSelected]}
                >
                  <View style={[styles.check, selected && styles.checkSelected]}>
                    <Text style={styles.checkText}>{selected ? '✓' : ''}</Text>
                  </View>
                  <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                    {amenity.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />

      {amenities.length === 0 ? (
        <Text style={styles.empty}>Nenhuma comodidade foi disponibilizada pela API.</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  grid: { gap: spacing.sm },
  item: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { borderColor: colors.brand, backgroundColor: colors.brand },
  checkText: { color: colors.white, fontWeight: '900' },
  itemText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  itemTextSelected: { color: colors.brandDark },
  empty: { color: colors.textMuted, fontSize: 13 },
});
