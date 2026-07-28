function normalizeUrl(value: string | undefined, fallback: string): string {
  return (value?.trim() || fallback).replace(/\/+$/, '');
}

export const env = {
  apiBaseUrl: normalizeUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL,
    'https://host.bsbimoveis.com.br/api',
  ),
  frontendUrl: normalizeUrl(
    process.env.EXPO_PUBLIC_FRONTEND_URL,
    'https://bsbimoveis.com.br',
  ),
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '',
  googleAndroidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '',
};
