import { z } from 'zod';
import type { Property, PropertyPurpose } from '@/types/api';

const numberText = z
  .string()
  .trim()
  .refine((value) => value === '' || Number.isFinite(Number(value.replace(',', '.'))), {
    message: 'Informe um número válido.',
  });

const nonNegativeNumberText = numberText.refine(
  (value) => value === '' || Number(value.replace(',', '.')) >= 0,
  { message: 'O valor não pode ser negativo.' },
);

const integerText = nonNegativeNumberText.refine(
  (value) => value === '' || Number.isInteger(Number(value.replace(',', '.'))),
  { message: 'Informe um número inteiro.' },
);

const positiveMoneyText = z
  .string()
  .trim()
  .refine((value) => Number(value.replace(',', '.')) > 0, {
    message: 'Informe um valor maior que zero.',
  });

export const propertyPurposeSchema = z.enum(['sale', 'rent', 'seasonal']);

export const detailsStepSchema = z
  .object({
    title: z.string().trim().min(5, 'Informe um título com pelo menos 5 caracteres.'),
    description: z
      .string()
      .trim()
      .min(20, 'Descreva o imóvel com pelo menos 20 caracteres.'),
    category_id: z.string().trim().min(1, 'Selecione a categoria do imóvel.'),
    purpose: propertyPurposeSchema,
    price_sale: nonNegativeNumberText,
    price_rent: nonNegativeNumberText,
    price_seasonal_daily: nonNegativeNumberText,
    area_useful: nonNegativeNumberText,
    area_total: nonNegativeNumberText,
    iptu: nonNegativeNumberText,
    condo_fee: nonNegativeNumberText,
    bedrooms: integerText,
    bathrooms: integerText,
    parking_spaces: integerText,
  })
  .superRefine((values, context) => {
    const priceField =
      values.purpose === 'rent'
        ? 'price_rent'
        : values.purpose === 'seasonal'
          ? 'price_seasonal_daily'
          : 'price_sale';

    const result = positiveMoneyText.safeParse(values[priceField]);
    if (!result.success) {
      context.addIssue({
        code: 'custom',
        path: [priceField],
        message: result.error.issues[0]?.message ?? 'Informe o valor do imóvel.',
      });
    }
  });

export const addressStepSchema = z.object({
  postal_code: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length === 8, 'Informe um CEP válido com 8 dígitos.'),
  address_line: z.string().trim().min(3, 'Informe o endereço.'),
  address_number: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, 'Informe o bairro.'),
  city: z.string().trim().min(2, 'Informe a cidade.'),
  state: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => value.length === 2, 'Informe a UF com 2 letras.'),
  latitude: z
    .string()
    .trim()
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= -90 && Number(value) <= 90, {
      message: 'Defina uma latitude válida no mapa.',
    }),
  longitude: z
    .string()
    .trim()
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= -180 && Number(value) <= 180, {
      message: 'Defina uma longitude válida no mapa.',
    }),
});

export const amenitiesStepSchema = z.object({
  amenity_ids: z.array(z.number().int().positive()),
});

export const propertyFormSchema = detailsStepSchema
  .and(addressStepSchema)
  .and(amenitiesStepSchema);

export interface PropertyFormValues {
  title: string;
  description: string;
  category_id: string;
  purpose: PropertyPurpose;
  price_sale: string;
  price_rent: string;
  price_seasonal_daily: string;
  area_useful: string;
  area_total: string;
  iptu: string;
  condo_fee: string;
  bedrooms: string;
  bathrooms: string;
  parking_spaces: string;
  postal_code: string;
  address_line: string;
  address_number: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  amenity_ids: number[];
}

export const defaultPropertyFormValues: PropertyFormValues = {
  title: '',
  description: '',
  category_id: '',
  purpose: 'sale',
  price_sale: '',
  price_rent: '',
  price_seasonal_daily: '',
  area_useful: '',
  area_total: '',
  iptu: '',
  condo_fee: '',
  bedrooms: '',
  bathrooms: '',
  parking_spaces: '',
  postal_code: '',
  address_line: '',
  address_number: '',
  neighborhood: '',
  city: 'Brasília',
  state: 'DF',
  latitude: '-15.793889',
  longitude: '-47.882778',
  amenity_ids: [],
};

function asText(value: number | string | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

export function propertyToFormValues(property: Property): PropertyFormValues {
  return {
    title: property.title ?? '',
    description: property.description ?? '',
    category_id: asText(property.category_id ?? property.category?.id),
    purpose: property.purpose,
    price_sale: asText(property.price_sale),
    price_rent: asText(property.price_rent),
    price_seasonal_daily: asText(property.price_seasonal_daily),
    area_useful: asText(property.area_useful),
    area_total: asText(property.area_total),
    iptu: asText(property.iptu),
    condo_fee: asText(property.condo_fee),
    bedrooms: asText(property.bedrooms),
    bathrooms: asText(property.bathrooms),
    parking_spaces: asText(property.parking_spaces),
    postal_code: property.postal_code ?? '',
    address_line: property.address_line ?? '',
    address_number: property.address_number ?? '',
    neighborhood: property.neighborhood ?? '',
    city: property.city ?? 'Brasília',
    state: property.state ?? 'DF',
    latitude: asText(property.latitude ?? -15.793889),
    longitude: asText(property.longitude ?? -47.882778),
    amenity_ids: property.amenities?.map((amenity) => amenity.id) ?? [],
  };
}

export function nullableNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function buildDetailsPayload(values: PropertyFormValues) {
  const activePrice =
    values.purpose === 'rent'
      ? { price_sale: null, price_rent: nullableNumber(values.price_rent), price_seasonal_daily: null }
      : values.purpose === 'seasonal'
        ? {
            price_sale: null,
            price_rent: null,
            price_seasonal_daily: nullableNumber(values.price_seasonal_daily),
          }
        : { price_sale: nullableNumber(values.price_sale), price_rent: null, price_seasonal_daily: null };

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category_id: Number(values.category_id),
    purpose: values.purpose,
    ...activePrice,
    area_useful: nullableNumber(values.area_useful),
    area_total: nullableNumber(values.area_total),
    iptu: nullableNumber(values.iptu),
    condo_fee: nullableNumber(values.condo_fee),
    bedrooms: nullableNumber(values.bedrooms),
    bathrooms: nullableNumber(values.bathrooms),
    parking_spaces: nullableNumber(values.parking_spaces),
  };
}

export function buildAddressPayload(values: PropertyFormValues) {
  return {
    postal_code: values.postal_code.replace(/\D/g, ''),
    address_line: values.address_line.trim(),
    address_number: values.address_number.trim() || null,
    neighborhood: values.neighborhood.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
  };
}
