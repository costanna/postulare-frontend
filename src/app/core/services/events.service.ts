import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApplicationEvent, EventCreatePayload } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  list(applicationId: string): Observable<ApplicationEvent[]> {
    return this.http.get<ApplicationEvent[]>(`${this.baseUrl}/applications/${applicationId}/events`);
  }

  create(applicationId: string, payload: EventCreatePayload): Observable<ApplicationEvent> {
    return this.http.post<ApplicationEvent>(`${this.baseUrl}/applications/${applicationId}/events`, payload);
  }

  delete(eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/events/${eventId}`);
  }
}
