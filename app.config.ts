import type { ConfigContext, ExpoConfig } from 'expo/config';

const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
  'f8ddfe5c-4d03-4ee2-a9e5-b8be0c81b790';

function resolveGoogleAuthMode(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'authsession' || normalized === 'disabled'
    ? normalized
    : 'native';
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BSB Imóveis',
  slug: 'bsbimoveis-app',
  scheme: 'bsbimoveis',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'br.com.bsbimoveis.app',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
    },
  },
  android: {
    package: 'br.com.bsbimoveis.app',
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
  },
  web: {
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    [
      'expo-secure-store',
      {
        faceIDPermission:
          'A BSB Imóveis usa o Face ID para liberar seu acesso biométrico neste aparelho.',
      },
    ],
    ...(resolveGoogleAuthMode(process.env.EXPO_PUBLIC_GOOGLE_AUTH_MODE) === 'native'
      ? [
          [
            '@react-native-google-signin/google-signin',
            {
              iosUrlScheme:
                process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ||
                'com.googleusercontent.apps.UNCONFIGURED',
            },
          ] as const,
        ]
      : []),
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'A BSB Imóveis usa sua localização para mostrar imóveis próximos de você.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'A BSB Imóveis acessa suas fotos para adicionar imagens aos anúncios.',
        cameraPermission:
          'A BSB Imóveis acessa a câmera para fotografar os imóveis anunciados.',
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
