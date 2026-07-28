import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, radius, spacing } from '@/theme/tokens';
import { chooseProfileImage } from './avatarImage';
import { resolveAvatarUrl, uploadAvatar, type UserProfile } from './profileService';

interface AvatarEditorProps {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => Promise<void>;
  onFeedback: (message: string, tone: 'success' | 'error') => void;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AvatarEditor({ profile, onUpdated, onFeedback }: AvatarEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const avatarUrl = useMemo(() => resolveAvatarUrl(profile.avatar_path), [profile.avatar_path]);

  async function selectAvatar() {
    setIsUploading(true);
    try {
      const uri = await chooseProfileImage();
      if (!uri) return;
      const response = await uploadAvatar(uri);
      await onUpdated(response.data);
      onFeedback('Foto do perfil atualizada com sucesso.', 'success');
    } catch (error) {
      onFeedback(
        error instanceof Error ? error.message : 'Não foi possível atualizar a foto.',
        'error',
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.avatarShell}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{initials(profile.name)}</Text>
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <Text style={styles.hint}>Recorte quadrado com saída JPG em 512×512.</Text>
      </View>
      <Button
        label={isUploading ? 'Enviando...' : 'Alterar foto'}
        variant="secondary"
        loading={isUploading}
        onPress={() => void selectAvatar()}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, alignItems: 'center' },
  avatarShell: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: colors.brandDark, fontSize: 32, fontWeight: '900' },
  copy: { alignItems: 'center', gap: spacing.xs },
  name: { color: colors.text, fontSize: 18, fontWeight: '900' },
  email: { color: colors.textMuted, fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  button: { alignSelf: 'stretch' },
});
