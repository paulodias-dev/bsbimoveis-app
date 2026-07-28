export type ReferralTarget = 'referrer' | 'referred';

export interface ReferralBenefitPreview {
  target: ReferralTarget;
  type: string;
  label: string;
}

export interface ReferralProgramSummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: string | null;
  status_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  max_uses_per_code: number | null;
  benefits_preview: ReferralBenefitPreview[];
}

export interface ReferralCodeSummary {
  id: number;
  code: string;
  status: string | null;
  status_label: string | null;
  uses_count: number;
  remaining_uses: number | null;
  last_used_at: string | null;
  expires_at: string | null;
  share_url: string;
}

export interface ReferralMetrics {
  total_uses: number;
  pending_uses: number;
  qualified_uses: number;
  rewarded_uses: number;
  rejected_uses: number;
  cancelled_uses: number;
  granted_rewards: number;
  pending_rewards: number;
}

export interface ReferralUseSummary {
  id: number;
  status: string | null;
  status_label: string | null;
  used_at: string | null;
  qualified_at: string | null;
  rewarded_at: string | null;
  rejection_reason: string | null;
  program: { id: number; name: string; slug: string } | null;
  code: { id: number; code: string; status: string | null } | null;
  referred: { id: number; name: string } | null;
}

export interface UserReferralSummary {
  program: ReferralProgramSummary | null;
  code: ReferralCodeSummary | null;
  metrics: ReferralMetrics;
  uses: ReferralUseSummary[];
}
