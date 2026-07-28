import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Property } from '@/types/api';
import { colors, radius, spacing } from '@/theme/tokens';
import {
  imageAssetName,
  type PreparedPropertyImage,
} from '../../propertyService';

interface PhotosStepProps {
  property: Property;
  isUploading: boolean;
  busyPhotoId: number | null;
  onUpload: (images: PreparedPropertyImage[]) => Promise<void>;
  onRemove: (photoId: number) => Promise<void>;
  onMove: (photoId: number, direction: -1 | 1) => Promise<void>;
  onFeedback: (message: string | null, tone?: 'success' | 'error') => void;
}

async function prepareAsset(
  asset: ImagePicker.ImagePickerAsset,
  index: number,
): Promise<PreparedPropertyImage> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > 1920) context.resize({ width: 1920, height: null });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.86, format: SaveFormat.JPEG });

  return {
    uri: saved.uri,
    name: imageAssetName({ ...asset, mimeType: 'image/jpeg' }, index).replace(/\.[^.]+$/, '.jpg'),
    type: 'image/jpeg',
  };
}

export function PhotosStep({
  property,
  isUploading,
  busyPhotoId,
  onUpload,
  onRemove,
  onMove,
  onFeedback,
}: PhotosStepProps) {
  const photos = [...(property.photos ?? [])].sort((left, right) => left.sort_order - right.sort_order);
  const photoLimit = property.photo_limit;
  const remaining = photoLimit === null ? null : Math.max(photoLimit - photos.length, 0);

  async function pickPhotos() {
    if (remaining === 0) {
      onFeedback('O limite de fotos do plano foi atingido.', 'error');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onFeedback('Permita o acesso às fotos para continuar.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining ?? 10,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) return;

    try {
      onFeedback('Preparando as imagens para envio...', 'success');
      const prepared = await Promise.all(result.assets.map(prepareAsset));
      await onUpload(prepared);
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Não foi possível preparar as imagens.',
        'error',
      );
    }
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Text style={styles.title}>Fotos do anúncio</Text>
        <Text style={styles.description}>
          A primeira foto é a capa. As imagens são redimensionadas e comprimidas antes do envio.
        </Text>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{photos.length}</Text>
            <Text style={styles.metricLabel}>enviadas</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{photoLimit ?? '∞'}</Text>
            <Text style={styles.metricLabel}>limite</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{remaining ?? '∞'}</Text>
            <Text style={styles.metricLabel}>disponíveis</Text>
          </View>
        </View>
        <Button
          label={isUploading ? 'Enviando fotos...' : 'Selecionar fotos'}
          loading={isUploading}
          disabled={remaining === 0}
          onPress={() => void pickPhotos()}
        />
      </Card>

      {photos.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>Nenhuma foto enviada</Text>
          <Text style={styles.emptyText}>
            Adicione imagens claras dos ambientes. O anúncio pode ser salvo como rascunho antes da publicação.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {photos.map((photo, index) => {
            const busy = busyPhotoId === photo.id;
            return (
              <Card key={photo.id} style={styles.photoCard}>
                <View style={styles.imageShell}>
                  <Image source={{ uri: photo.url }} style={styles.image} />
                  {index === 0 ? (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverText}>CAPA</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoTitle} numberOfLines={1}>
                    {photo.original_name || `Foto ${index + 1}`}
                  </Text>
                  <Text style={styles.photoHint}>Posição {index + 1}</Text>
                  <View style={styles.actions}>
                    <Pressable
                      disabled={busy || index === 0}
                      onPress={() => void onMove(photo.id, -1)}
                      style={[styles.smallButton, (busy || index === 0) && styles.disabled]}
                    >
                      <Text style={styles.smallButtonText}>Anterior</Text>
                    </Pressable>
                    <Pressable
                      disabled={busy || index === photos.length - 1}
                      onPress={() => void onMove(photo.id, 1)}
                      style={[
                        styles.smallButton,
                        (busy || index === photos.length - 1) && styles.disabled,
                      ]}
                    >
                      <Text style={styles.smallButtonText}>Próxima</Text>
                    </Pressable>
                    <Pressable
                      disabled={busy}
                      onPress={() => void onRemove(photo.id)}
                      style={[styles.removeButton, busy && styles.disabled]}
                    >
                      <Text style={styles.removeButtonText}>{busy ? 'Aguarde' : 'Excluir'}</Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  headerCard: { gap: spacing.md },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    alignItems: 'center',
  },
  metricValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  list: { gap: spacing.md },
  photoCard: { padding: spacing.sm, flexDirection: 'row', gap: spacing.md },
  imageShell: {
    width: 112,
    height: 104,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  image: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    left: spacing.xs,
    top: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  coverText: { color: colors.white, fontSize: 9, fontWeight: '900' },
  photoInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  photoTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  photoHint: { color: colors.textMuted, fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  smallButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  smallButtonText: { color: colors.brandDark, fontSize: 11, fontWeight: '800' },
  removeButton: {
    borderRadius: radius.sm,
    backgroundColor: '#FEE4E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  removeButtonText: { color: colors.danger, fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.4 },
});
