export type Seniority = 'junior' | 'mid' | 'senior';
export type PreferredLanguage = 'ca' | 'es' | 'en';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  skills: string[];
  location: string | null;
  desired_position: string | null;
  seniority: Seniority | null;
  min_salary: number | null;
  preferred_language: PreferredLanguage;
  /** Resumen profesional libre; alimenta las cartas de presentación. */
  about: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface ProfileUpdatePayload {
  full_name?: string | null;
  skills?: string[];
  location?: string | null;
  desired_position?: string | null;
  seniority?: Seniority | null;
  min_salary?: number | null;
  preferred_language?: PreferredLanguage;
  about?: string | null;
}

export interface CvImportResult {
  full_name: string | null;
  desired_position: string | null;
  location: string | null;
  seniority: Seniority | null;
  skills: string[];
  about: string | null;
}
