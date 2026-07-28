import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const imageUrl = property.cover_photo?.url ?? property.photos?.[0]?.url ?? null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.imageFallbackText}>Sem foto</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.topline}>
          <Text style={styles.badge}>{purposeLabel(property.purpose)}</Text>
          <Text style={styles.price}>{propertyPrice(property)}</Text>
        </View>

        <Text numberOfLines={2} style={styles.title}>
          {property.title}
        </Text>
        <Text numberOfLines={1} style={styles.location}>
          {propertyLocation(property) || 'Localização não informada'}
        </Text>

        <View style={styles.specs}>
          <Text style={styles.spec}>{property.bedrooms ?? 0} quartos</Text>
          <Text style={styles.spec}>{property.bathrooms ?? 0} banheiros</Text>
          <Text style={styles.spec}>{property.area_useful ?? property.area_total ?? 0} m²</Text>
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
  pressed: {
    opacity: 0.88,
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: colors.surfaceAlt,
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
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  title: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
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
  spec: {
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
  },
});
