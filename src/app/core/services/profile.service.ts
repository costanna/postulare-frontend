import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CvImportResult, ProfileUpdatePayload, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`);
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/profile`, payload);
  }

  importCv(file: File): Observable<CvImportResult> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<CvImportResult>(`${this.baseUrl}/profile/import-cv`, body);
  }
}
