import type { Property } from '@/types/api';

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return 'Consulte';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function propertyPrice(property: Property): string {
  if (property.purpose === 'rent') {
    return `${formatCurrency(property.price_rent)}/mês`;
  }

  if (property.purpose === 'seasonal') {
    return `${formatCurrency(property.price_seasonal_daily)}/dia`;
  }

  return formatCurrency(property.price_sale);
}

export function propertyLocation(property: Property): string {
  return [property.neighborhood, property.city, property.state]
    .filter(Boolean)
    .join(', ');
}

export function purposeLabel(purpose: Property['purpose']): string {
  if (purpose === 'rent') return 'Aluguel';
  if (purpose === 'seasonal') return 'Temporada';
  return 'Venda';
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir a solicitação.',
): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
