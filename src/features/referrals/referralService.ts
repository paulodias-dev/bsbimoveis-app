import { apiClient } from '@/services/apiClient';
import type { ResourceResponse } from '@/types/api';
import type { UserReferralSummary } from './types';

export function getMyReferralSummary() {
  return apiClient.get<ResourceResponse<UserReferralSummary>>('/referrals/me');
}
