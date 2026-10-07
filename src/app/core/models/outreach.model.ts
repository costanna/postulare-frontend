export interface TargetCompany {
  id: string;
  name: string;
  email: string;
  language: 'ca' | 'es' | 'en';
  notes: string | null;
  created_at: string;
  last_sent_at: string | null;
  retry_in_days: number;
  can_send: boolean;
}

export interface TargetSendResult {
  target_id: string;
  ok: boolean;
  sent_to: string | null;
  error: string | null;
}

export interface SendQuota {
  daily_limit: number;
  sent_today: number;
  daily_remaining: number;
}
