import { ResponseType, makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { env } from '@/config/env';
import { getErrorMessage } from '@/utils/format';

WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthSessionButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onAccessToken: (accessToken: string) => Promise<void>;
  onLoadingChange: (value: boolean) => void;
  onMessageChange: (value: string | null) => void;
}

export function GoogleAuthSessionButton({
  disabled = false,
  loading = false,
  onAccessToken,
  onLoadingChange,
  onMessageChange,
}: GoogleAuthSessionButtonProps) {
  const redirectUri = useMemo(
    () =>
      makeRedirectUri({
        scheme: 'bsbimoveis',
        path: 'oauthredirect',
      }),
    [],
  );

  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: env.googleWebClientId || undefined,
    androidClientId: env.googleAndroidClientId || undefined,
    iosClientId: env.googleIosClientId || undefined,
    responseType: ResponseType.Token,
    redirectUri,
    selectAccount: true,
  });

  async function handlePress() {
    onLoadingChange(true);
    onMessageChange(null);

    try {
      const result = await promptAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }

      if (result.type !== 'success') {
        throw new Error('O login com Google foi cancelado.');
      }

      const accessToken =
        result.authentication?.accessToken || result.params.access_token || '';

      if (!accessToken) {
        throw new Error('O Google nao retornou um token de acesso.');
      }

      await onAccessToken(accessToken);
    } catch (error) {
      onMessageChange(
        getErrorMessage(error, 'Nao foi possivel entrar com Google.'),
      );
    } finally {
      onLoadingChange(false);
    }
  }

  return (
    <Button
      label={loading ? 'Conectando ao Google...' : 'Entrar com Google'}
      variant="secondary"
      disabled={disabled || !request}
      loading={loading}
      onPress={() => void handlePress()}
    />
  );
}
