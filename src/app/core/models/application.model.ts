export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
];

/** Estados que forman las columnas del Kanban (withdrawn no tiene columna propia). */
export const KANBAN_STATUSES: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];

export interface Application {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  source: string | null;
  salary_range: string | null;
  job_url: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreatePayload {
  company_name: string;
  position: string;
  status: ApplicationStatus;
  source?: string | null;
  salary_range?: string | null;
  job_url?: string | null;
  notes?: string | null;
  applied_at?: string | null;
}

export type ApplicationUpdatePayload = Partial<ApplicationCreatePayload>;

export interface ApplicationFilters {
  status?: ApplicationStatus;
  company?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
