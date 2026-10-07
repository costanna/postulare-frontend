import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Application } from '../models/application.model';
import { SendQuota, TargetCompany, TargetSendResult } from '../models/outreach.model';

export interface SpontaneousSendResult {
  application: Application;
  target: TargetCompany;
  sent_to: string;
  subject: string;
  language: string;
  cv_source: string;
}

@Injectable({ providedIn: 'root' })
export class OutreachService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/targets`;

  quota(): Observable<SendQuota> {
    return this.http.get<SendQuota>(`${this.baseUrl}/quota`);
  }

  list(): Observable<TargetCompany[]> {
    return this.http.get<TargetCompany[]>(this.baseUrl);
  }

  create(payload: { name: string; email: string; language: string; notes?: string | null }): Observable<TargetCompany> {
    return this.http.post<TargetCompany>(this.baseUrl, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  send(id: string): Observable<SpontaneousSendResult> {
    return this.http.post<SpontaneousSendResult>(`${this.baseUrl}/${id}/send`, {});
  }

  sendBulk(ids: string[]): Observable<{ sent: TargetSendResult[]; daily_remaining: number }> {
    return this.http.post<{ sent: TargetSendResult[]; daily_remaining: number }>(
      `${this.baseUrl}/send-bulk`,
      { target_ids: ids }
    );
  }
}
