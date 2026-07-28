import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';
import type {
  PaginatedResponse,
  Property,
  ResourceResponse,
  Subscription,
} from '@/types/api';

interface PainelState {
  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;
  properties: Property[];
  favorites: Property[];
  subscription: Subscription | null;
  hydrate: (force?: boolean) => Promise<void>;
  refreshProperties: () => Promise<void>;
  reset: () => void;
}

export const usePainelStore = create<PainelState>((set, get) => ({
  isLoading: false,
  hasHydrated: false,
  error: null,
  properties: [],
  favorites: [],
  subscription: null,

  hydrate: async (force = false) => {
    const state = get();
    if (!force && (state.isLoading || state.hasHydrated)) return;

    set({ isLoading: true, error: null });

    try {
      const [properties, favorites, subscription] = await Promise.all([
        apiClient.get<PaginatedResponse<Property>>('/me/properties?per_page=100'),
        apiClient.get<PaginatedResponse<Property>>('/me/favorites?per_page=100'),
        apiClient.get<ResourceResponse<Subscription | null>>('/subscription'),
      ]);

      set({
        properties: properties.data ?? [],
        favorites: favorites.data ?? [],
        subscription: subscription.data ?? null,
        isLoading: false,
        hasHydrated: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        hasHydrated: true,
        error: error instanceof Error ? error.message : 'Erro ao carregar o painel.',
      });
    }
  },

  refreshProperties: async () => {
    const response = await apiClient.get<PaginatedResponse<Property>>(
      '/me/properties?per_page=100',
    );
    set({ properties: response.data ?? [], error: null, hasHydrated: true });
  },

  reset: () =>
    set({
      isLoading: false,
      hasHydrated: false,
      error: null,
      properties: [],
      favorites: [],
      subscription: null,
    }),
}));
