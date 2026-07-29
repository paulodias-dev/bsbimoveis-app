import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Property } from '@/types/api';
import { colors, radius, spacing } from '@/theme/tokens';
import {
  propertyLocation,
  propertyPrice,
  purposeLabel,
} from '@/utils/format';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  layout?: 'list' | 'grid';
  style?: StyleProp<ViewStyle>;
}

export function PropertyCard({
  property,
  onPress,
  layout = 'list',
  style,
}: PropertyCardProps) {
  const imageUrl = property.cover_photo?.url ?? property.photos?.[0]?.url ?? null;
  const isGrid = layout === 'grid';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isGrid && styles.gridCard,
        pressed && styles.pressed,
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, isGrid && styles.gridImage]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, isGrid && styles.gridImage, styles.imageFallback]}>
          <Text style={styles.imageFallbackText}>Sem foto</Text>
        </View>
      )}

      <View style={[styles.body, isGrid && styles.gridBody]}>
        <View style={[styles.topline, isGrid && styles.gridTopline]}>
          <Text style={styles.badge}>{purposeLabel(property.purpose)}</Text>
          <Text style={[styles.price, isGrid && styles.gridPrice]}>{propertyPrice(property)}</Text>
        </View>

        <Text numberOfLines={isGrid ? 3 : 2} style={[styles.title, isGrid && styles.gridTitle]}>
          {property.title}
        </Text>
        <Text numberOfLines={isGrid ? 2 : 1} style={styles.location}>
          {propertyLocation(property) || 'Localização não informada'}
        </Text>

        <View style={[styles.specs, isGrid && styles.gridSpecs]}>
          <Text style={[styles.spec, isGrid && styles.gridSpec]}>
            {property.bedrooms ?? 0} {isGrid ? 'qts' : 'quartos'}
          </Text>
          <Text style={[styles.spec, isGrid && styles.gridSpec]}>
            {property.bathrooms ?? 0} {isGrid ? 'banh' : 'banheiros'}
          </Text>
          <Text style={[styles.spec, isGrid && styles.gridSpec]}>
            {property.area_useful ?? property.area_total ?? 0} m²
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  gridCard: {
    borderRadius: 22,
  },
  pressed: {
    opacity: 0.88,
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: colors.surfaceAlt,
  },
  gridImage: {
    height: 146,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  gridBody: {
    padding: spacing.sm,
    gap: 6,
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  gridTopline: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 6,
  },
  badge: {
    color: colors.brandDark,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: '800',
  },
  price: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  gridPrice: {
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  gridTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  location: {
    color: colors.textMuted,
    fontSize: 13,
  },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridSpecs: {
    gap: 6,
  },
  spec: {
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
  },
  gridSpec: {
    fontSize: 11,
    paddingHorizontal: 10,
  },
});
