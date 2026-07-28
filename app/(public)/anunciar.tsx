import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const profiles = [
  {
    id: 'owner',
    title: 'Proprietário direto',
    badge: 'PESSOA FÍSICA',
    summary: 'Vou anunciar meu próprio imóvel.',
    description: 'Ideal para quem deseja vender ou alugar um imóvel sem intermediários.',
  },
  {
    id: 'broker',
    title: 'Corretor ou imobiliária',
    badge: 'PROFISSIONAL',
    summary: 'Quero divulgar imóveis da minha carteira.',
    description: 'Gerencie anúncios, contatos, publicação e desempenho pelo painel.',
  },
  {
    id: 'developer',
    title: 'Incorporadora ou construtora',
    badge: 'EMPRESA',
    summary: 'Vou anunciar empreendimentos ou lançamentos.',
    description: 'Organize ofertas e dados comerciais para sua equipe.',
  },
] as const;

type AdvertiserProfile = (typeof profiles)[number]['id'];

export default function AdvertiseScreen() {
  const { isAuthenticated } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<AdvertiserProfile>('owner');
  const selected = profiles.find((profile) => profile.id === selectedProfile) ?? profiles[0];

  function continueFlow() {
    if (isAuthenticated) {
      router.push('/painel/imoveis/novo');
      return;
    }

    router.push({
      pathname: '/cadastro',
      params: { intent: 'publish', profile: selectedProfile },
    });
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Anúncio gratuito"
        title="Com qual perfil você se identifica?"
        description="Primeiro criamos sua conta. Depois você cadastra endereço, fotos e características no painel."
      />

      <Card style={styles.trustCard}>
        <View style={styles.trustItem}><Text style={styles.trustCheck}>✓</Text><Text style={styles.trustText}>Sem cartão para começar</Text></View>
        <View style={styles.trustItem}><Text style={styles.trustCheck}>✓</Text><Text style={styles.trustText}>Conta antes do imóvel</Text></View>
        <View style={styles.trustItem}><Text style={styles.trustCheck}>✓</Text><Text style={styles.trustText}>Publicação revisada</Text></View>
      </Card>

      <View style={styles.profileList}>
        {profiles.map((profile) => {
          const active = profile.id === selectedProfile;
          return (
            <Pressable
              key={profile.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedProfile(profile.id)}
            >
              <Card style={[styles.profileCard, active && styles.profileCardActive]}>
                <View style={styles.profileHeader}>
                  <View style={styles.profileCopy}>
                    <Text style={styles.badge}>{profile.badge}</Text>
                    <Text style={styles.profileTitle}>{profile.title}</Text>
                    <Text style={styles.profileSummary}>{profile.summary}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    <Text style={styles.radioText}>{active ? '✓' : ''}</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{selected.title}</Text>
        <Text style={styles.summaryText}>{selected.description}</Text>
      </Card>

      <Card style={styles.processCard}>
        <Text style={styles.processTitle}>Primeiro a conta. Depois o imóvel.</Text>
        <Step number="1" title="Perfil do anunciante" active />
        <Step number="2" title="Conta gratuita" />
        <Step number="3" title="Dados do imóvel" />
      </Card>

      <Button
        label={isAuthenticated ? 'Cadastrar imóvel' : 'Criar conta e anunciar'}
        onPress={continueFlow}
      />
      {!isAuthenticated ? (
        <Button
          label="Já tenho conta"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/entrar',
              params: { intent: 'publish', profile: selectedProfile },
            })
          }
        />
      ) : null}
    </Screen>
  );
}

function Step({ number, title, active = false }: { number: string; title: string; active?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepNumber, active && styles.stepNumberActive]}>
        <Text style={[styles.stepNumberText, active && styles.stepNumberTextActive]}>{number}</Text>
      </View>
      <Text style={[styles.stepTitle, active && styles.stepTitleActive]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  trustCard: { gap: spacing.sm, backgroundColor: colors.surfaceAlt },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trustCheck: { color: colors.success, fontWeight: '900' },
  trustText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  profileList: { gap: spacing.md },
  profileCard: { gap: spacing.sm },
  profileCardActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  profileHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  profileCopy: { flex: 1, gap: spacing.xs },
  badge: { color: colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  profileTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  profileSummary: { color: colors.textMuted, fontSize: 12 },
  radio: { width: 30, height: 30, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.brand, backgroundColor: colors.brand },
  radioText: { color: colors.white, fontWeight: '900' },
  summaryCard: { gap: spacing.xs, backgroundColor: '#F8F9FF' },
  summaryTitle: { color: colors.brandDark, fontSize: 15, fontWeight: '900' },
  summaryText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  processCard: { gap: spacing.md },
  processTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepNumber: { width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepNumberActive: { backgroundColor: colors.brand },
  stepNumberText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  stepNumberTextActive: { color: colors.white },
  stepTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  stepTitleActive: { color: colors.brandDark },
});
