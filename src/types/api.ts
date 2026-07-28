export type PropertyPurpose = 'sale' | 'rent' | 'seasonal';
export type PropertyPublicationStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'paused';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  status: string;
  avatar_path: string | null;
  role: string | null;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
}

export interface PropertyCategory {
  id: number;
  name: string;
  slug: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Amenity {
  id: number;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PropertyPhoto {
  id: number;
  url: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface PropertyAdvertiser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  creci: string | null;
  company_name: string | null;
  company_phone: string | null;
  company_whatsapp: string | null;
  company_website: string | null;
  avatar_path: string | null;
  bio: string | null;
  roles: string[];
}

export interface Property {
  id: number;
  user_id: number;
  user?: PropertyAdvertiser | null;
  category: PropertyCategory | null;
  title: string;
  description: string | null;
  purpose: PropertyPurpose;
  price_sale: number | null;
  price_rent: number | null;
  price_seasonal_daily: number | null;
  area_useful: number | null;
  area_total: number | null;
  iptu: number | null;
  condo_fee: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  address_line: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  views_count: number;
  favorites_count: number;
  is_favorited: boolean;
  is_published: boolean;
  publication_status: PropertyPublicationStatus | null;
  publication_rejection_reason: string | null;
  amenities: Amenity[];
  photos: PropertyPhoto[];
  cover_photo: PropertyPhoto | null;
  photos_count: number;
  photo_limit: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  limit_properties: number;
  max_photos_per_property: number;
  duration_days: number;
  has_featured: boolean;
  is_active: boolean;
  is_default: boolean;
  is_recommended: boolean;
  is_free: boolean;
}

export interface Subscription {
  id: number;
  plan_id: number | null;
  plan: Plan | null;
  starts_at: string | null;
  expires_at: string | null;
  remaining_slots: number;
  is_active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
}

export interface CollectionResponse<T> {
  data: T[];
}

export interface ResourceResponse<T> {
  data: T;
}

export interface ApiErrorPayload {
  message?: string;
  error?: {
    type?: string;
    details?: Record<string, string[]> | Record<string, unknown>;
    retry_after?: number;
  };
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly type?: string,
    public readonly details?: Record<string, string[]> | Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
