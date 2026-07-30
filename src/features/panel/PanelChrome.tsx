import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import {
  type ComponentProps,
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
  isProfileMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  openProfileMenu: () => void;
  closeProfileMenu: () => void;
}

const PanelChromeContext = createContext<PanelChromeContextValue | null>(null);

export function PanelChromeProvider({ children }: PropsWithChildren) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const value = useMemo<PanelChromeContextValue>(
    () => ({
      isMenuOpen,
      isProfileMenuOpen,
      openMenu: () => {
        setIsProfileMenuOpen(false);
        setIsMenuOpen(true);
      },
      closeMenu: () => setIsMenuOpen(false),
      openProfileMenu: () => {
        setIsMenuOpen(false);
        setIsProfileMenuOpen(true);
      },
      closeProfileMenu: () => setIsProfileMenuOpen(false),
    }),
    [isMenuOpen, isProfileMenuOpen],
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
    </View>
  );
}

export function PanelHeader() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { openMenu, openProfileMenu } = usePanelChrome();
  const isDashboard = pathname === '/painel' || pathname === '/painel/';
  const avatarUrl = resolveAvatarUrl(user?.avatar_path);

  return (
    <View style={[styles.headerShell, { paddingTop: insets.top + 6 }]}>
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
          accessibilityLabel="Abrir menu da conta"
          onPress={openProfileMenu}
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

interface ProfileMenuAction {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  danger?: boolean;
}

export function PanelProfileMenu() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isProfileMenuOpen, closeProfileMenu } = usePanelChrome();

  const navigate = useCallback(
    (href: string) => {
      closeProfileMenu();
      requestAnimationFrame(() => router.push(href as never));
    },
    [closeProfileMenu],
  );

  const signOut = useCallback(async () => {
    closeProfileMenu();
    await logout();
    router.replace('/');
  }, [closeProfileMenu, logout]);

  const actions = useMemo<ProfileMenuAction[]>(
    () => [
      {
        label: 'Voltar para o site',
        icon: 'close',
        onPress: () => {
          closeProfileMenu();
          requestAnimationFrame(() => router.replace('/'));
        },
      },
      {
        label: 'Editar perfil',
        icon: 'person-circle-outline',
        onPress: () => navigate('/painel/perfil'),
      },
      {
        label: 'Segurança',
        icon: 'shield-checkmark-outline',
        onPress: () => navigate('/painel/seguranca'),
      },
      {
        label: 'Assinatura',
        icon: 'information-circle-outline',
        onPress: () => navigate('/painel/assinatura'),
      },
      {
        label: 'Sair',
        icon: 'log-out-outline',
        onPress: () => void signOut(),
        danger: true,
      },
    ],
    [closeProfileMenu, navigate, signOut],
  );

  return (
    <Modal
      visible={isProfileMenuOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeProfileMenu}
    >
      <View style={styles.profileMenuRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar menu da conta"
          onPress={closeProfileMenu}
          style={styles.profileMenuBackdrop}
        />

        <View
          style={[
            styles.profileMenuCard,
            {
              marginTop: insets.top + 58,
            },
          ]}
        >
          <View style={styles.profileMenuHeader}>
            <Text style={styles.profileMenuName} numberOfLines={1}>
              {user?.name ?? 'Usuário'}
            </Text>
            <Text style={styles.profileMenuEmail} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>

          <View style={styles.profileMenuItems}>
            {actions.slice(0, -1).map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.profileMenuItem,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name={action.icon} size={26} color="#667085" />
                <Text style={styles.profileMenuItemText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.profileMenuDivider} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair"
            onPress={actions[actions.length - 1]?.onPress}
            style={({ pressed }) => [styles.profileMenuLogout, pressed && styles.pressed]}
          >
            <Text style={styles.profileMenuLogoutText}>Sair</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function PanelBottomBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const hidden = pathname.includes('/imoveis/novo') || pathname.includes('/editar');

  if (hidden) return null;

  return (
    <View style={[styles.bottomShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name ?? 'Usuário'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
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
                          <Text
                            style={[
                              styles.drawerItemLabel,
                              active && styles.drawerItemLabelActive,
                            ]}
                          >
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
              style={({ pressed }) => [
                styles.footerAction,
                styles.logoutAction,
                pressed && styles.pressed,
              ]}
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
    backgroundColor: '#F6F8FC',
  },
  orbTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -120,
    right: -90,
    backgroundColor: 'rgba(49,87,255,0.10)',
  },
  orbMiddle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: '42%',
    left: -120,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  orbBottom: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    bottom: -180,
    right: -140,
    backgroundColor: 'rgba(34,197,94,0.05)',
  },
  headerShell: {
    minHeight: 84,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EDF5',
    backgroundColor: '#F8FAFD',
  },
  headerContent: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLeft: {
    minWidth: 48,
    flexDirection: 'row',
    gap: 4,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
    ...shadow.card,
  },
  headerTitleArea: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerEyebrow: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  headerAvatar: {
    width: 43,
    height: 43,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E9EEFF',
    ...shadow.card,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
  },
  avatarText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: '900',
  },
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E7ECF3',
    backgroundColor: 'rgba(255,255,255,0.98)',
    ...shadow.card,
  },
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
  bottomItemActive: {
    backgroundColor: '#EEF3FF',
  },
  bottomLabel: {
    color: '#7A8499',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomLabelActive: {
    color: colors.brandDark,
    fontWeight: '900',
  },
  centerSlot: {
    flex: 1,
    minHeight: 74,
    alignItems: 'center',
    marginTop: -22,
  },
  centerButton: {
    width: 57,
    height: 57,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  centerLabel: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  profileMenuRoot: {
    flex: 1,
  },
  profileMenuBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9,17,38,0.18)',
  },
  profileMenuCard: {
    alignSelf: 'flex-end',
    width: '68%',
    maxWidth: 330,
    marginRight: spacing.lg,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 16,
  },
  profileMenuHeader: {
    gap: 4,
    paddingBottom: spacing.md,
  },
  profileMenuName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  profileMenuEmail: {
    color: colors.textMuted,
    fontSize: 11,
  },
  profileMenuItems: {
    gap: spacing.xs,
  },
  profileMenuItem: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileMenuItemText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  profileMenuDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: '#DDE3ED',
  },
  profileMenuLogout: {
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: spacing.sm,
  },
  profileMenuLogoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9,17,38,0.38)',
  },
  drawerShell: {
    width: '87%',
    maxWidth: 374,
    height: '100%',
    borderTopRightRadius: 34,
    borderBottomRightRadius: 34,
    borderRightWidth: 1,
    borderRightColor: '#E8EDF5',
    backgroundColor: '#F8FAFD',
    shadowColor: '#101828',
    shadowOffset: { width: 18, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 18,
  },
  drawerTopbar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  brandName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  brandCaption: {
    color: colors.textMuted,
    fontSize: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    backgroundColor: '#FFFFFF',
    ...shadow.card,
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
  drawerAvatarText: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: 11,
  },
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
  accountBadgeText: {
    color: colors.brandDark,
    fontSize: 9,
    fontWeight: '900',
  },
  drawerScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  drawerGroup: {
    gap: spacing.sm,
  },
  groupTitle: {
    paddingHorizontal: spacing.sm,
    color: '#98A2B3',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  groupItems: {
    gap: 4,
  },
  drawerItem: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  drawerItemActive: {
    backgroundColor: '#EEF3FF',
  },
  drawerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6FB',
  },
  drawerIconActive: {
    backgroundColor: colors.brand,
  },
  drawerItemCopy: {
    flex: 1,
    gap: 2,
  },
  drawerItemLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  drawerItemLabelActive: {
    color: colors.brandDark,
    fontWeight: '900',
  },
  drawerDescription: {
    color: colors.textMuted,
    fontSize: 10,
  },
  drawerFooter: {
    marginHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(152,162,179,0.24)',
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
  footerActionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutAction: {
    backgroundColor: 'rgba(217,45,32,0.06)',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
