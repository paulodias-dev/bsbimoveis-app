import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { resolveAvatarUrl } from '@/features/profile/profileService';
import { colors, radius, shadow, spacing } from '@/theme/tokens';
import {
  bottomNavigationItems,
  drawerNavigationGroups,
  isPanelRouteActive,
  panelRouteTitle,
  type PanelNavigationItem,
} from './navigation';

interface PanelChromeContextValue {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const PanelChromeContext = createContext<PanelChromeContextValue | null>(null);

export function PanelChromeProvider({ children }: PropsWithChildren) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const value = useMemo<PanelChromeContextValue>(
    () => ({
      isMenuOpen,
      openMenu: () => setIsMenuOpen(true),
      closeMenu: () => setIsMenuOpen(false),
    }),
    [isMenuOpen],
  );

  return <PanelChromeContext.Provider value={value}>{children}</PanelChromeContext.Provider>;
}

function usePanelChrome(): PanelChromeContextValue {
  const context = useContext(PanelChromeContext);
  if (!context) throw new Error('PanelChromeProvider não encontrado.');
  return context;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function activeIcon(item: PanelNavigationItem): PanelNavigationItem['icon'] {
  if (item.label === 'Início') return 'home';
  if (item.label === 'Imóveis') return 'business';
  if (item.label === 'Dados') return 'analytics';
  if (item.label === 'Conta') return 'person';
  return item.icon;
}

export function PanelBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.backgroundBase} />
      <View style={styles.orbTop} />
      <View style={styles.orbMiddle} />
      <View style={styles.orbBottom} />
      <View style={styles.backgroundWash} />
    </View>
  );
}

export function PanelHeader() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { openMenu } = usePanelChrome();
  const isDashboard = pathname === '/painel' || pathname === '/painel/';
  const avatarUrl = resolveAvatarUrl(user?.avatar_path);

  return (
    <View style={[styles.headerShell, { paddingTop: insets.top + 6 }]}>
      <BlurView
        intensity={58}
        tint="light"
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glassTint]} />
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          {!isDashboard ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            onPress={openMenu}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.headerTitleArea}>
          <Text style={styles.headerEyebrow}>BSB IMÓVEIS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {panelRouteTitle(pathname)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => router.push('/painel/perfil')}
          style={({ pressed }) => [styles.headerAvatar, pressed && styles.pressed]}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials(user?.name ?? 'U')}</Text>
          )}
          <View style={styles.onlineDot} />
        </Pressable>
      </View>
    </View>
  );
}

export function PanelBottomBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const hidden = pathname.includes('/imoveis/novo') || pathname.includes('/editar');

  if (hidden) return null;

  return (
    <View style={[styles.bottomShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView
        intensity={72}
        tint="light"
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bottomTint]} />
      <View style={styles.bottomContent}>
        {bottomNavigationItems.map((item, index) => {
          const active = isPanelRouteActive(pathname, item);
          const center = index === 2;

          if (center) {
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel="Cadastrar imóvel"
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [styles.centerSlot, pressed && styles.pressed]}
              >
                <View style={styles.centerButton}>
                  <Ionicons name="add" size={29} color={colors.white} />
                </View>
                <Text style={styles.centerLabel}>{item.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(item.href)}
              style={({ pressed }) => [
                styles.bottomItem,
                active && styles.bottomItemActive,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={active ? activeIcon(item) : item.icon}
                size={22}
                color={active ? colors.brand : '#7A8499'}
              />
              <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PanelDrawer() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isMenuOpen, closeMenu } = usePanelChrome();
  const avatarUrl = resolveAvatarUrl(user?.avatar_path);

  const navigate = useCallback(
    (href: PanelNavigationItem['href']) => {
      closeMenu();
      requestAnimationFrame(() => router.push(href));
    },
    [closeMenu],
  );

  async function signOut() {
    closeMenu();
    await logout();
    router.replace('/');
  }

  return (
    <Modal
      visible={isMenuOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeMenu}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
          onPress={closeMenu}
          style={styles.drawerBackdrop}
        />

        <View
          style={[
            styles.drawerShell,
            {
              paddingTop: Math.max(insets.top, spacing.md),
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <BlurView
            intensity={86}
            tint="light"
            blurMethod="dimezisBlurViewSdk31Plus"
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.drawerTint]} />

          <View style={styles.drawerTopbar}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons name="home" size={17} color={colors.white} />
              </View>
              <View>
                <Text style={styles.brandName}>BSB Imóveis</Text>
                <Text style={styles.brandCaption}>Painel do anunciante</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
              onPress={closeMenu}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={23} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.drawerAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.drawerAvatarText}>{initials(user?.name ?? 'U')}</Text>
              )}
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName} numberOfLines={1}>{user?.name ?? 'Usuário'}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
              <View style={styles.accountBadge}>
                <Ionicons name="sparkles" size={11} color={colors.brandDark} />
                <Text style={styles.accountBadgeText}>Conta ativa</Text>
              </View>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerScroll}
          >
            {drawerNavigationGroups.map((group) => (
              <View key={group.title} style={styles.drawerGroup}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.groupItems}>
                  {group.items.map((item) => {
                    const active = isPanelRouteActive(pathname, item);
                    return (
                      <Pressable
                        key={item.label}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => navigate(item.href)}
                        style={({ pressed }) => [
                          styles.drawerItem,
                          active && styles.drawerItemActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={[styles.drawerIcon, active && styles.drawerIconActive]}>
                          <Ionicons
                            name={item.icon}
                            size={20}
                            color={active ? colors.white : colors.textMuted}
                          />
                        </View>
                        <View style={styles.drawerItemCopy}>
                          <Text style={[styles.drawerItemLabel, active && styles.drawerItemLabelActive]}>
                            {item.label}
                          </Text>
                          {item.description ? (
                            <Text style={styles.drawerDescription}>{item.description}</Text>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#98A2B3" />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.drawerFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                closeMenu();
                router.push('/');
              }}
              style={({ pressed }) => [styles.footerAction, pressed && styles.pressed]}
            >
              <Ionicons name="globe-outline" size={20} color={colors.textMuted} />
              <Text style={styles.footerActionText}>Ver portal público</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void signOut()}
              style={({ pressed }) => [styles.footerAction, styles.logoutAction, pressed && styles.pressed]}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backgroundBase: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#EEF2FF',
  },
  backgroundWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(248,250,255,0.34)',
  },
  orbTop: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -145,
    right: -95,
    backgroundColor: 'rgba(93,120,255,0.25)',
  },
  orbMiddle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: '35%',
    left: -150,
    backgroundColor: 'rgba(107,227,214,0.20)',
  },
  orbBottom: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    bottom: -190,
    right: -130,
    backgroundColor: 'rgba(170,132,255,0.18)',
  },
  glassTint: { backgroundColor: 'rgba(255,255,255,0.20)' },
  headerShell: {
    minHeight: 84,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.50)',
  },
  headerContent: {
    minHeight: 66,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLeft: { minWidth: 48, flexDirection: 'row', gap: 4 },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    backgroundColor: 'rgba(255,255,255,0.54)',
  },
  headerTitleArea: { flex: 1, alignItems: 'center', gap: 2 },
  headerEyebrow: { color: colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  headerAvatar: {
    width: 43,
    height: 43,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.94)',
    backgroundColor: colors.brandSoft,
    ...shadow.card,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: radius.pill },
  avatarText: { color: colors.brandDark, fontSize: 13, fontWeight: '900' },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: '#12B76A',
  },
  bottomShell: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.56)',
    ...shadow.card,
  },
  bottomTint: { backgroundColor: 'rgba(255,255,255,0.18)' },
  bottomContent: {
    minHeight: 68,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bottomItem: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.md,
  },
  bottomItemActive: { backgroundColor: 'rgba(49,87,255,0.08)' },
  bottomLabel: { color: '#7A8499', fontSize: 10, fontWeight: '700' },
  bottomLabelActive: { color: colors.brandDark, fontWeight: '900' },
  centerSlot: { flex: 1, minHeight: 74, alignItems: 'center', marginTop: -22 },
  centerButton: {
    width: 57,
    height: 57,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.94)',
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 8,
  },
  centerLabel: { color: colors.brandDark, fontSize: 10, fontWeight: '900', marginTop: 2 },
  modalRoot: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9,17,38,0.42)',
  },
  drawerShell: {
    width: '87%',
    maxWidth: 374,
    height: '100%',
    overflow: 'hidden',
    borderTopRightRadius: 34,
    borderBottomRightRadius: 34,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(248,250,255,0.84)',
    shadowColor: '#101828',
    shadowOffset: { width: 18, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 18,
  },
  drawerTint: { backgroundColor: 'rgba(255,255,255,0.20)' },
  drawerTopbar: {
    zIndex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  brandName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  brandCaption: { color: colors.textMuted, fontSize: 10 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.90)',
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  profileCard: {
    zIndex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  drawerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  drawerAvatarText: { color: colors.brandDark, fontSize: 18, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 3 },
  profileName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  profileEmail: { color: colors.textMuted, fontSize: 11 },
  accountBadge: {
    alignSelf: 'flex-start',
    marginTop: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandSoft,
  },
  accountBadgeText: { color: colors.brandDark, fontSize: 9, fontWeight: '900' },
  drawerScroll: { zIndex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.lg },
  drawerGroup: { gap: spacing.sm },
  groupTitle: {
    paddingHorizontal: spacing.sm,
    color: '#98A2B3',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  groupItems: { gap: 4 },
  drawerItem: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  drawerItemActive: { backgroundColor: 'rgba(49,87,255,0.10)' },
  drawerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  drawerIconActive: { backgroundColor: colors.brand },
  drawerItemCopy: { flex: 1, gap: 2 },
  drawerItemLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  drawerItemLabelActive: { color: colors.brandDark, fontWeight: '900' },
  drawerDescription: { color: colors.textMuted, fontSize: 10 },
  drawerFooter: {
    zIndex: 1,
    marginHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(152,162,179,0.30)',
    gap: 4,
  },
  footerAction: {
    minHeight: 46,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerActionText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  logoutAction: { backgroundColor: 'rgba(217,45,32,0.06)' },
  logoutText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.68, transform: [{ scale: 0.97 }] },
});
