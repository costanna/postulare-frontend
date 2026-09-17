import { ApplicationStatus } from './application.model';

export interface StatsSummary {
  total_applications: number;
  total_applied: number;
  total_interviews: number;
  total_offers: number;
  total_rejected: number;
  response_rate: number;
}

export interface StatusCount {
  status: ApplicationStatus;
  count: number;
}

export interface TimelinePoint {
  month: string;
  count: number;
}

export interface SourceCount {
  source: string;
  count: number;
}
