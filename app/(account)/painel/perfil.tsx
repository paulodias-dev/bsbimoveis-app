import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { useAuth } from '@/features/auth/AuthProvider';
import { AvatarEditor } from '@/features/profile/AvatarEditor';
import { ProfileForm } from '@/features/profile/ProfileForm';
import { getProfile, type UserProfile } from '@/features/profile/profileService';
import { colors } from '@/theme/tokens';

type Feedback = { message: string; tone: 'success' | 'error' };

export default function ProfileScreen() {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;

    void getProfile()
      .then((response) => {
        if (active) setProfile(response.data);
      })
      .catch((error) => {
        if (!active) return;
        setFeedback({
          message: error instanceof Error ? error.message : 'Não foi possível carregar o perfil.',
          tone: 'error',
        });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleUpdated(nextProfile: UserProfile) {
    setProfile(nextProfile);
    await refreshProfile();
  }

  function handleFeedback(message: string, tone: 'success' | 'error') {
    setFeedback({ message, tone });
  }

  if (isLoading) {
    return (
      <Screen>
        <StateView title="Carregando perfil..." loading />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <StateView
          title="Perfil indisponível"
          description={feedback?.message ?? 'Não foi possível carregar os dados da conta.'}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Conta"
        title="Meu perfil"
        description="Mantenha seus dados de contato, empresa e apresentação atualizados."
      />

      {feedback ? (
        <Card style={feedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess}>
          <Text style={feedback.tone === 'error' ? styles.errorText : styles.successText}>
            {feedback.message}
          </Text>
        </Card>
      ) : null}

      <AvatarEditor
        profile={profile}
        onUpdated={handleUpdated}
        onFeedback={handleFeedback}
      />
      <ProfileForm
        key={`${profile.id}-${profile.name}-${profile.avatar_path ?? ''}`}
        profile={profile}
        onUpdated={handleUpdated}
        onFeedback={handleFeedback}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  feedbackSuccess: { borderColor: '#6CE9A6', backgroundColor: '#ECFDF3' },
  successText: { color: '#027A48', fontSize: 13, fontWeight: '700' },
  feedbackError: { borderColor: '#FDA29B', backgroundColor: '#FEF3F2' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
});
