import * as Crypto from 'expo-crypto';
import { apiClient } from '@/services/apiClient';
import type { CollectionResponse, Plan, ResourceResponse, Subscription } from '@/types/api';

export interface PaymentResponse {
  order_id: number;
  status: string;
  gateway_id: string | null;
  amount: number;
  payment_method: string;
  pix: {
    qr_code: string | null;
    qr_code_base64: string | null;
    ticket_url: string | null;
  };
}

export interface PixPaymentPayload {
  plan_id: number;
  payer_name?: string;
  payer_email?: string;
  identification_type?: string;
  identification_number?: string;
}

export function getSubscription() {
  return apiClient.get<ResourceResponse<Subscription | null>>('/subscription');
}

export function getPlans() {
  return apiClient.get<CollectionResponse<Plan>>('/plans', { auth: false });
}

export function generatePixPayment(payload: PixPaymentPayload) {
  return apiClient.post<PaymentResponse>('/payments/pix', payload, {
    idempotencyKey: Crypto.randomUUID(),
  });
}
