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

export type CoverLetterSource = 'ai' | 'template';

/** Por qué se usó la plantilla en vez de la IA. */
export type TemplateReason = 'no_key' | 'demo' | 'user_limit' | 'global_limit' | 'ai_error';

export interface Match {
  id: string;
  score: number;
  reasoning: string | null;
  status: MatchStatus;
  created_at: string;
  job_offer: JobOffer;
  cover_letter: string | null;
  cover_letter_source: CoverLetterSource | null;
  cover_letter_at: string | null;
  /** Ya tienes una candidatura con esta misma oferta. */
  already_tracked: boolean;
}

export interface MatchSearchResult {
  fetched: number;
  new_matches: number;
  updated_matches: number;
  /** Ofertas descartadas por repetidas o por estar ya en tus candidaturas. */
  skipped_duplicates: number;
}

export interface CoverLetter {
  cover_letter: string;
  source: CoverLetterSource;
  generated_at: string;
  template_reason: TemplateReason | null;
  ai_available: boolean;
  /** Cartas con IA que le quedan hoy; null = sin tope o IA no disponible. */
  ai_remaining: number | null;
}

export interface ConvertOptions {
  applied?: boolean;
  /** Fecha local (YYYY-MM-DD) en que aplicaste. */
  applied_at?: string;
}

export interface CoverLetterRequest {
  language?: 'ca' | 'es' | 'en';
  regenerate?: boolean;
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
