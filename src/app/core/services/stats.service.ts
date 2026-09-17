import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SourceCount, StatsSummary, StatusCount, TimelinePoint } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/stats`;

  getSummary(): Observable<StatsSummary> {
    return this.http.get<StatsSummary>(`${this.baseUrl}/summary`);
  }

  getByStatus(): Observable<StatusCount[]> {
    return this.http.get<StatusCount[]>(`${this.baseUrl}/by-status`);
  }

  getTimeline(): Observable<TimelinePoint[]> {
    return this.http.get<TimelinePoint[]>(`${this.baseUrl}/timeline`);
  }

  getBySource(): Observable<SourceCount[]> {
    return this.http.get<SourceCount[]>(`${this.baseUrl}/by-source`);
  }
}
