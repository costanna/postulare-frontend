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
}
