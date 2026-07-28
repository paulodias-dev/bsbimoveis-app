import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';
import { resolveAvatarUrl } from '@/features/profile/profileService';
import { colors, spacing } from '@/theme/tokens';

export default function AccountScreen() {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();

  if (isBootstrapping) {
    return (
      <Screen>
        <StateView title="Validando sua sessão..." loading />
      </Screen>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Screen>
        <PageHeader
          eyebrow="Conta"
          title="Entre para anunciar e gerenciar imóveis"
          description="Acesse sua assinatura, favoritos e painel do anunciante."
        />
        <View style={styles.actions}>
          <Button label="Entrar" onPress={() => router.push('/entrar')} />
          <Button
            label="Criar conta"
            variant="secondary"
            onPress={() => router.push('/cadastro')}
          />
        </View>
      </Screen>
    );
  }

  const avatarUrl = resolveAvatarUrl(user.avatar_path);

  return (
    <Screen>
      <PageHeader
        eyebrow="Sua conta"
        title={`Olá, ${user.name.split(/\s+/)[0] || user.name}`}
        description="Sua sessão está protegida e sincronizada com a API do portal."
      />

      <Card>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((item) => item[0]?.toUpperCase())
                  .join('')}
              </Text>
            )}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button label="Abrir painel" onPress={() => router.push('/painel')} />
        <Button
          label="Editar perfil"
          variant="secondary"
          onPress={() => router.push('/painel/perfil')}
        />
        <Button
          label="Segurança"
          variant="secondary"
          onPress={() => router.push('/painel/seguranca')}
        />
        <Button
          label="Sair da conta"
          variant="secondary"
          onPress={() => void logout()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.brandDark, fontSize: 18, fontWeight: '900' },
  profileText: { flex: 1, gap: spacing.xs },
  name: { color: colors.text, fontSize: 18, fontWeight: '900' },
  email: { color: colors.textMuted, fontSize: 14 },
});
