import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Application,
  ApplicationCreatePayload,
  ApplicationFilters,
  ApplicationUpdatePayload,
  FollowUp,
  Page,
} from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/applications`;

  list(filters: ApplicationFilters = {}): Observable<Page<Application>> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.company) params = params.set('company', filters.company);
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    params = params.set('page', filters.page ?? 1).set('page_size', filters.page_size ?? 20);

    return this.http.get<Page<Application>>(this.baseUrl, { params });
  }

  followUps(): Observable<FollowUp[]> {
    return this.http.get<FollowUp[]>(`${this.baseUrl}/follow-ups`);
  }

  /** Todas las candidaturas en CSV (se pide con HttpClient para que lleve el token). */
  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
  }

  get(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.baseUrl}/${id}`);
  }

  create(payload: ApplicationCreatePayload): Observable<Application> {
    return this.http.post<Application>(this.baseUrl, payload);
  }

  update(id: string, payload: ApplicationUpdatePayload): Observable<Application> {
    return this.http.patch<Application>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
