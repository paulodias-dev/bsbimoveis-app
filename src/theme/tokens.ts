export const colors = {
  brand: '#3157FF',
  brandDark: '#203CC7',
  brandSoft: '#EEF2FF',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F3F9',
  text: '#101828',
  textMuted: '#667085',
  border: '#E4E7EC',
  success: '#039855',
  warning: '#DC6803',
  danger: '#D92D20',
  mapMarker: '#172B4D',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const layout = {
  publicTabBarHeight: 68,
} as const;

export const shadow = {
  card: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
} as const;
