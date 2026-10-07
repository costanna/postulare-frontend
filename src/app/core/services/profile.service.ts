import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CvImportResult, ProfileUpdatePayload, User, UserCv } from '../models/user.model';

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

  getCvs(): Observable<UserCv[]> {
    return this.http.get<UserCv[]>(`${this.baseUrl}/profile/cvs`);
  }

  saveCv(language: string, content: string): Observable<UserCv> {
    return this.http.put<UserCv>(`${this.baseUrl}/profile/cvs/${language}`, { content });
  }

  uploadCvFile(language: string, file: File): Observable<UserCv> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<UserCv>(`${this.baseUrl}/profile/cvs/${language}/file`, body);
  }

  deleteCvFile(language: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profile/cvs/${language}/file`);
  }
}
