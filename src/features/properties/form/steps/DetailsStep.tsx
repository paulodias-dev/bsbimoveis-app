import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { PropertyCategory, PropertyPurpose } from '@/types/api';
import { colors, radius, spacing } from '@/theme/tokens';
import { FormTextField } from '../FormTextField';
import type { PropertyFormValues } from '../schema';

interface DetailsStepProps {
  categories: PropertyCategory[];
}

const purposes: Array<{ value: PropertyPurpose; label: string; hint: string }> = [
  { value: 'sale', label: 'Venda', hint: 'Valor total do imóvel' },
  { value: 'rent', label: 'Aluguel', hint: 'Valor mensal' },
  { value: 'seasonal', label: 'Temporada', hint: 'Valor por diária' },
];

export function DetailsStep({ categories }: DetailsStepProps) {
  const { control } = useFormContext<PropertyFormValues>();
  const purpose = useWatch({ control, name: 'purpose' });

  const priceField =
    purpose === 'rent'
      ? 'price_rent'
      : purpose === 'seasonal'
        ? 'price_seasonal_daily'
        : 'price_sale';
  const priceLabel =
    purpose === 'rent'
      ? 'Aluguel mensal (R$)'
      : purpose === 'seasonal'
        ? 'Diária (R$)'
        : 'Valor de venda (R$)';

  return (
    <View style={styles.container}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Identificação</Text>
        <FormTextField
          name="title"
          label="Título do anúncio"
          placeholder="Ex.: Apartamento com 3 quartos na Asa Norte"
          autoCapitalize="sentences"
        />
        <FormTextField
          name="description"
          label="Descrição"
          placeholder="Apresente os diferenciais, condições e características do imóvel."
          multiline
          numberOfLines={5}
          autoCapitalize="sentences"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Finalidade</Text>
        <Controller
          control={control}
          name="purpose"
          render={({ field: { value, onChange } }) => (
            <View style={styles.optionGrid}>
              {purposes.map((option) => {
                const selected = value === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => onChange(option.value)}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionHint}>{option.hint}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
        <FormTextField
          name={priceField}
          label={priceLabel}
          placeholder="0,00"
          keyboardType="decimal-pad"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Categoria</Text>
        <Controller
          control={control}
          name="category_id"
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <View style={styles.selectionGroup}>
              <View style={styles.categoryGrid}>
                {categories.map((category) => {
                  const selected = value === String(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => onChange(String(category.id))}
                      style={[styles.category, selected && styles.categorySelected]}
                    >
                      <Text
                        style={[styles.categoryText, selected && styles.categoryTextSelected]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {error ? <Text style={styles.error}>{error.message}</Text> : null}
            </View>
          )}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Características</Text>
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <FormTextField name="bedrooms" label="Quartos" keyboardType="numeric" />
          </View>
          <View style={styles.column}>
            <FormTextField name="bathrooms" label="Banheiros" keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <FormTextField name="parking_spaces" label="Vagas" keyboardType="numeric" />
          </View>
          <View style={styles.column}>
            <FormTextField name="area_useful" label="Área útil (m²)" keyboardType="decimal-pad" />
          </View>
        </View>
        <FormTextField name="area_total" label="Área total (m²)" keyboardType="decimal-pad" />
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <FormTextField name="condo_fee" label="Condomínio (R$)" keyboardType="decimal-pad" />
          </View>
          <View style={styles.column}>
            <FormTextField name="iptu" label="IPTU (R$)" keyboardType="decimal-pad" />
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  optionGrid: { gap: spacing.sm },
  option: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.xs,
  },
  optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  optionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  optionTitleSelected: { color: colors.brandDark },
  optionHint: { color: colors.textMuted, fontSize: 12 },
  selectionGroup: { gap: spacing.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  category: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  categorySelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  categoryText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  categoryTextSelected: { color: colors.brandDark },
  twoColumns: { flexDirection: 'row', gap: spacing.sm },
  column: { flex: 1 },
  error: { color: colors.danger, fontSize: 12 },
});
