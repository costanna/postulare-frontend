export type MatchStatus = 'new' | 'dismissed' | 'converted';

export interface JobOffer {
  id: string;
  source: string;
  title: string;
  company_name: string | null;
  location: string | null;
  description: string | null;
  salary_range: string | null;
  url: string | null;
  fetched_at: string;
}

export interface Match {
  id: string;
  score: number;
  reasoning: string | null;
  status: MatchStatus;
  created_at: string;
  job_offer: JobOffer;
}

export interface MatchSearchResult {
  fetched: number;
  new_matches: number;
  updated_matches: number;
}
