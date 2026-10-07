import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Application } from '../models/application.model';
import {
  ApplyPack,
  AutoApplyResult,
  BulkAutoApplyResult,
  ConvertOptions,
  CoverLetter,
  CoverLetterRequest,
  Match,
  MatchSearchResult,
  MatchStatus,
  SearchFilters,
  SearchFiltersState,
} from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/matches`;

  getFilters(): Observable<SearchFiltersState> {
    return this.http.get<SearchFiltersState>(`${this.baseUrl}/filters`);
  }

  saveFilters(filters: SearchFilters): Observable<SearchFiltersState> {
    return this.http.put<SearchFiltersState>(`${this.baseUrl}/filters`, filters);
  }

  search(): Observable<MatchSearchResult> {
    return this.http.post<MatchSearchResult>(`${this.baseUrl}/search`, {});
  }

  list(status?: MatchStatus, limit = 50): Observable<Match[]> {
    let params = new HttpParams().set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<Match[]>(this.baseUrl, { params });
  }

  /** Crea la candidatura; con `applied` nace como "enviada" (ya has aplicado) en vez de "guardada". */
  convert(matchId: string, options: ConvertOptions = {}): Observable<Application> {
    return this.http.post<Application>(`${this.baseUrl}/${matchId}/convert`, options);
  }

  dismiss(matchId: string): Observable<Match> {
    return this.http.post<Match>(`${this.baseUrl}/${matchId}/dismiss`, {});
  }

  coverLetter(matchId: string, request: CoverLetterRequest = {}): Observable<CoverLetter> {
    return this.http.post<CoverLetter>(`${this.baseUrl}/${matchId}/cover-letter`, request);
  }

  /** Kit listo para enviar sin convertir: carta plantilla + CV + email + checklist. */
  applyPack(matchId: string): Observable<ApplyPack> {
    return this.http.get<ApplyPack>(`${this.baseUrl}/${matchId}/apply-pack`);
  }

  /** Auto-postulación gratuita: convierte a «aplicada» y devuelve el kit de envío. */
  autoApply(matchId: string): Observable<AutoApplyResult> {
    return this.http.post<AutoApplyResult>(`${this.baseUrl}/${matchId}/auto-apply`, {});
  }

  /** Convierte de golpe las mejores ofertas nuevas (por score). */
  bulkAutoApply(min_score = 60, limit = 5): Observable<BulkAutoApplyResult> {
    return this.http.post<BulkAutoApplyResult>(`${this.baseUrl}/auto-apply-bulk`, { min_score, limit });
  }
}
