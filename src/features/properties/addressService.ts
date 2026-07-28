import { apiClient } from '@/services/apiClient';
import type { ResourceResponse } from '@/types/api';

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

export interface PostalCodeAddress {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface AddressSearchInput {
  postal_code: string;
  address_line: string;
  address_number?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  label: string;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizedNumber(value?: string): string {
  const trimmed = value?.trim() ?? '';
  const token = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return token === 'sn' || token === 'semnumero' ? '' : trimmed;
}

export function buildAddressSearchQuery(values: AddressSearchInput): string {
  const street = [values.address_line.trim(), normalizedNumber(values.address_number)]
    .filter(Boolean)
    .join(', ');

  return [
    street,
    values.neighborhood.trim(),
    values.city.trim(),
    values.state.trim(),
    digitsOnly(values.postal_code),
    'Brasil',
  ]
    .filter(Boolean)
    .join(', ');
}

export async function lookupPostalCode(postalCode: string): Promise<PostalCodeAddress> {
  const digits = digitsOnly(postalCode);
  if (digits.length !== 8) throw new Error('Informe um CEP válido com 8 dígitos.');

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error('Não foi possível consultar o CEP agora.');
  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) throw new Error('CEP não encontrado.');

  return {
    postalCode: data.cep ?? digits,
    street: data.logradouro?.trim() ?? '',
    neighborhood: data.bairro?.trim() ?? '',
    city: data.localidade?.trim() ?? '',
    state: data.uf?.trim().toUpperCase() ?? '',
  };
}

export async function geocodeAddress(values: AddressSearchInput): Promise<GeocodedAddress> {
  try {
    const response = await apiClient.post<ResourceResponse<GeocodedAddress>>(
      '/geocoding/nominatim',
      values,
    );

    if (
      Number.isFinite(Number(response.data.latitude)) &&
      Number.isFinite(Number(response.data.longitude))
    ) {
      return response.data;
    }
  } catch {
    // O proxy do backend é preferencial; a consulta pública abaixo é somente fallback.
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'br');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('q', buildAddressSearchQuery(values));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  });

  if (!response.ok) throw new Error('Não foi possível localizar o endereço no mapa.');
  const items = (await response.json()) as NominatimItem[];
  const first = items[0];
  if (!first) throw new Error('Não encontramos coordenadas para esse endereço.');

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    label: first.display_name,
  };
}
