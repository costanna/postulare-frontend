import type { Application } from './application.model';

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
  /** Modalidad que dice la oferta; null si no lo dice. */
  work_mode: DetectedWorkMode | null;
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
  cover_letter_language: 'ca' | 'es' | 'en' | null;
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
  /** Idioma en que está escrita la carta guardada (null en cartas antiguas). */
  language: 'ca' | 'es' | 'en' | null;
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

/** Kit de envío gratuito: carta + CV + email + checklist para completar en el portal. */
export interface ApplyPack {
  cover_letter: string;
  cover_letter_source: string;
  language: string | null;
  /** Idioma detectado en la oferta; null = se usó tu idioma. */
  detected_language: string | null;
  /** Email de contacto extraído de la oferta; null = no lo trae. */
  contact_email: string | null;
  cv_markdown: string;
  email_subject: string;
  email_body: string;
  mailto_link: string;
  offer_url: string | null;
  checklist: string[];
}

export interface AutoApplyResult {
  application: Application;
  pack: ApplyPack;
  needs_manual_step: boolean;
}

export interface BulkAutoApplyResult {
  converted: AutoApplyResult[];
  skipped: number;
}

export interface SendEmailResult {
  application: Application;
  sent_to: string;
  subject: string;
  language: string | null;
  detected_language: string | null;
}

export type DisabilityFilter = 'any' | 'require' | 'exclude';

export type DetectedWorkMode = 'remote' | 'hybrid' | 'onsite';

export type WorkModeFilter = 'any' | DetectedWorkMode;

export interface SearchFilters {
  keywords: string | null;
  location: string | null;
  radius_km: number;
  exclude: string | null;
  exclude_other_levels: boolean;
  /** Ofertas que mencionan la discapacidad: any = no filtrar, require = solo esas, exclude = descartarlas. */
  disability: DisabilityFilter;
  /** remote / hybrid piden que la oferta lo diga; onsite incluye las que no dicen nada. */
  work_mode: WorkModeFilter;
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
