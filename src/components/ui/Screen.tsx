import { usePathname } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/theme/tokens';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}

export function Screen({
  children,
  scroll = true,
  header,
  contentStyle,
  scrollProps,
}: ScreenProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isPanel = pathname.startsWith('/painel');
  const isPublicTab =
    pathname === '/' ||
    pathname === '/buscar' ||
    pathname === '/ver-no-mapa' ||
    pathname === '/favoritos' ||
    pathname === '/conta';
  const edges: Edge[] = isPanel ? ['left', 'right'] : ['top', 'left', 'right'];
  const publicTabSpacing = {
    paddingBottom: layout.publicTabBarHeight + insets.bottom,
  };

  const content = (
    <View
      style={[
        styles.content,
        isPanel && styles.panelContent,
        scroll && isPublicTab && publicTabSpacing,
        contentStyle,
      ]}
    >
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, isPanel && styles.panelSafeArea]}
      edges={edges}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  panelSafeArea: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  panelContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
