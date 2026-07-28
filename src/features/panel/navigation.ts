import type { ComponentProps } from 'react';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface PanelNavigationItem {
  label: string;
  description?: string;
  href: Href;
  icon: IconName;
  match: string;
}

export const bottomNavigationItems: PanelNavigationItem[] = [
  {
    label: 'Início',
    href: '/painel',
    icon: 'home-outline',
    match: '/painel',
  },
  {
    label: 'Imóveis',
    href: '/painel/imoveis',
    icon: 'business-outline',
    match: '/painel/imoveis',
  },
  {
    label: 'Novo',
    href: '/painel/imoveis/novo',
    icon: 'add',
    match: '/painel/imoveis/novo',
  },
  {
    label: 'Dados',
    href: '/painel/desempenho',
    icon: 'analytics-outline',
    match: '/painel/desempenho',
  },
  {
    label: 'Conta',
    href: '/painel/perfil',
    icon: 'person-outline',
    match: '/painel/perfil',
  },
];

export const drawerNavigationGroups: Array<{
  title: string;
  items: PanelNavigationItem[];
}> = [
  {
    title: 'Gestão',
    items: [
      {
        label: 'Visão geral',
        description: 'Resumo da operação',
        href: '/painel',
        icon: 'grid-outline',
        match: '/painel',
      },
      {
        label: 'Meus imóveis',
        description: 'Carteira e publicações',
        href: '/painel/imoveis',
        icon: 'business-outline',
        match: '/painel/imoveis',
      },
      {
        label: 'Cadastrar imóvel',
        description: 'Novo anúncio',
        href: '/painel/imoveis/novo',
        icon: 'add-circle-outline',
        match: '/painel/imoveis/novo',
      },
      {
        label: 'Desempenho',
        description: 'Alcance e qualidade',
        href: '/painel/desempenho',
        icon: 'stats-chart-outline',
        match: '/painel/desempenho',
      },
      {
        label: 'Mensagens',
        description: 'Oportunidades prioritárias',
        href: '/painel/mensagens',
        icon: 'chatbubble-ellipses-outline',
        match: '/painel/mensagens',
      },
    ],
  },
  {
    title: 'Conta e benefícios',
    items: [
      {
        label: 'Favoritos',
        description: 'Imóveis salvos',
        href: '/painel/favoritos',
        icon: 'heart-outline',
        match: '/painel/favoritos',
      },
      {
        label: 'Assinatura',
        description: 'Plano e pagamentos',
        href: '/painel/assinatura',
        icon: 'diamond-outline',
        match: '/painel/assinatura',
      },
      {
        label: 'Indique e ganhe',
        description: 'Cupons e recompensas',
        href: '/painel/indique-ganhe',
        icon: 'gift-outline',
        match: '/painel/indique-ganhe',
      },
      {
        label: 'Meu perfil',
        description: 'Dados e apresentação',
        href: '/painel/perfil',
        icon: 'person-circle-outline',
        match: '/painel/perfil',
      },
      {
        label: 'Segurança',
        description: 'Senha e acesso',
        href: '/painel/seguranca',
        icon: 'shield-checkmark-outline',
        match: '/painel/seguranca',
      },
    ],
  },
];

export function panelRouteTitle(pathname: string): string {
  if (pathname.includes('/imoveis/novo')) return 'Cadastrar imóvel';
  if (pathname.includes('/imoveis/') && pathname.includes('/editar')) return 'Editar imóvel';
  if (pathname === '/painel/imoveis') return 'Meus imóveis';
  if (pathname.startsWith('/painel/desempenho')) return 'Desempenho';
  if (pathname.startsWith('/painel/favoritos')) return 'Favoritos';
  if (pathname.startsWith('/painel/assinatura')) return 'Assinatura';
  if (pathname.startsWith('/painel/indique-ganhe')) return 'Indique e ganhe';
  if (pathname.startsWith('/painel/mensagens')) return 'Mensagens';
  if (pathname.startsWith('/painel/perfil')) return 'Meu perfil';
  if (pathname.startsWith('/painel/seguranca')) return 'Segurança';
  return 'Painel';
}

export function isPanelRouteActive(pathname: string, item: PanelNavigationItem): boolean {
  if (item.match === '/painel') return pathname === '/painel' || pathname === '/painel/';
  if (item.match === '/painel/imoveis') {
    return pathname === '/painel/imoveis' || pathname === '/painel/imoveis/';
  }
  return pathname.startsWith(item.match);
}
