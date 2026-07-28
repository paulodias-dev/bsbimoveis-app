import { env } from '@/config/env';
import { apiClient } from '@/services/apiClient';
import type { ResourceResponse } from '@/types/api';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  company_name: string | null;
  company_website: string | null;
  bio: string | null;
  avatar_path: string | null;
}

export interface ProfilePayload {
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  company_name?: string | null;
  company_website?: string | null;
  bio?: string | null;
}

export interface PasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export function getProfile() {
  return apiClient.get<ResourceResponse<UserProfile>>('/profile');
}

export function updateProfile(payload: ProfilePayload) {
  return apiClient.patch<ResourceResponse<UserProfile>>('/profile', payload);
}

export function updatePassword(payload: PasswordPayload) {
  return apiClient.put<{ message?: string }>('/profile/password', payload);
}

export function uploadAvatar(uri: string) {
  const form = new FormData();
  const file = {
    uri,
    name: `avatar-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob;
  form.append('avatar', file);
  return apiClient.patch<ResourceResponse<UserProfile>>('/profile', form);
}

export function resolveAvatarUrl(path: string | null | undefined): string | null {
  const value = path?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${env.frontendUrl}/${value.replace(/^\/+/, '')}`;
}
