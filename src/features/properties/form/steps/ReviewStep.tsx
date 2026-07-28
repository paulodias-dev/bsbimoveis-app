import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { Property, PropertyCategory, PropertyPurpose } from '@/types/api';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';
import type { PropertyFormValues } from '../schema';

interface ReviewStepProps {
  values: PropertyFormValues;
  property: Property;
  categories: PropertyCategory[];
}

function purposeLabel(purpose: PropertyPurpose): string {
  if (purpose === 'rent') return 'Aluguel';
  if (purpose === 'seasonal') return 'Temporada';
  return 'Venda';
}

function activePrice(values: PropertyFormValues): number | null {
  const raw =
    values.purpose === 'rent'
      ? values.price_rent
      : values.purpose === 'seasonal'
        ? values.price_seasonal_daily
        : values.price_sale;
  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function ReviewStep({ values, property, categories }: ReviewStepProps) {
  const category = categories.find((item) => String(item.id) === values.category_id);
  const price = activePrice(values);
  const location = [values.neighborhood, values.city, values.state].filter(Boolean).join(', ');
  const publicationLocked =
    property.publication_status === 'pending_review' ||
    property.publication_status === 'approved' ||
    property.is_published;

  return (
    <View style={styles.container}>
      <Card style={styles.hero}>
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {publicationLocked ? 'PUBLICAÇÃO EM ANDAMENTO' : 'PRONTO PARA REVISÃO'}
            </Text>
          </View>
        </View>
        <Text style={styles.title}>{values.title}</Text>
        <Text style={styles.location}>{location || 'Localização não informada'}</Text>
        <Text style={styles.price}>{price === null ? 'Preço não informado' : formatCurrency(price)}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo do anúncio</Text>
        <View style={styles.summaryGrid}>
          <Summary label="Finalidade" value={purposeLabel(values.purpose)} />
          <Summary label="Categoria" value={category?.name ?? 'Não selecionada'} />
          <Summary label="Quartos" value={values.bedrooms || '—'} />
          <Summary label="Banheiros" value={values.bathrooms || '—'} />
          <Summary label="Vagas" value={values.parking_spaces || '—'} />
          <Summary label="Área útil" value={values.area_useful ? `${values.area_useful} m²` : '—'} />
          <Summary label="Comodidades" value={String(values.amenity_ids.length)} />
          <Summary label="Fotos" value={String(property.photos?.length ?? 0)} />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Descrição</Text>
        <Text style={styles.description}>{values.description}</Text>
      </Card>

      <Card style={styles.notice}>
        <Text style={styles.noticeTitle}>Publicação sob revisão</Text>
        <Text style={styles.noticeText}>
          Ao solicitar a publicação, o anúncio será enviado para análise. Ele só aparecerá na vitrine depois da aprovação.
        </Text>
        {property.photos.length === 0 ? (
          <Text style={styles.warning}>Recomendação: adicione fotos antes de solicitar a publicação.</Text>
        ) : null}
      </Card>
    </View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  hero: { gap: spacing.sm, backgroundColor: colors.mapMarker },
  statusRow: { flexDirection: 'row' },
  statusBadge: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  statusText: { color: '#D6DEFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  title: { color: colors.white, fontSize: 22, fontWeight: '900' },
  location: { color: '#D0D5DD', fontSize: 13 },
  price: { color: colors.white, fontSize: 20, fontWeight: '900' },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: {
    width: '47%',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase' },
  summaryValue: { color: colors.text, fontSize: 14, fontWeight: '800' },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  notice: { gap: spacing.sm, borderColor: '#FEC84B', backgroundColor: '#FFFAEB' },
  noticeTitle: { color: '#93370D', fontSize: 15, fontWeight: '900' },
  noticeText: { color: '#B54708', fontSize: 13, lineHeight: 19 },
  warning: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
