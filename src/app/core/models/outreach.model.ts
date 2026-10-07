export interface TargetCompany {
  id: string;
  name: string;
  email: string;
  language: 'ca' | 'es' | 'en';
  notes: string | null;
  tags: string[];
  created_at: string;
  last_sent_at: string | null;
  retry_in_days: number;
  can_send: boolean;
  match_score: number;
}

export interface TargetSendResult {
  target_id: string;
  ok: boolean;
  sent_to: string | null;
  error: string | null;
}

export interface TargetPreview {
  target: TargetCompany;
  subject: string;
  cover_letter: string;
  language: string;
  cv_source: string;
}

export interface SendQuota {
  daily_limit: number;
  sent_today: number;
  daily_remaining: number;
}

export interface Suggestion {
  name: string;
  email: string;
  language: string | null;
  tags: string[];
  match_score: number;
  offers_count: number;
  source: string;
}
