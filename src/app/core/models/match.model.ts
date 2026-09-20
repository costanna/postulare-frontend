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

/** Filtros de "Buscar ofertas" editables por el usuario (todo opcional). */
export interface SearchFilters {
  keywords: string | null;
  location: string | null;
  radius_km: number;
  exclude: string | null;
  exclude_other_levels: boolean;
  max_days_old: number | null;
  min_score: number;
}

export interface SearchFiltersState {
  filters: SearchFilters;
  /** Consulta que se enviará a Adzuna con estos filtros. */
  effective_query: string;
  effective_location: string | null;
  /** Búsquedas reales que quedan hoy en el tope global; null = sin tope. */
  daily_remaining: number | null;
}
