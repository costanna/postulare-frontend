import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccessTokenOnly, LoginPayload, RegisterPayload, TokenPair } from '../models/auth.model';
import { PreferredLanguage, User } from '../models/user.model';
import { LanguageService } from './language.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorageService);
  private readonly language = inject(LanguageService);
  private readonly baseUrl = environment.apiUrl;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  /** Evita disparar varios refresh en paralelo cuando fallan varias peticiones a la vez. */
  private refreshInFlight$: Observable<string> | null = null;

  hasStoredSession(): boolean {
    return !!this.tokens.getRefreshToken();
  }

  getAccessToken(): string | null {
    return this.tokens.getAccessToken();
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/register`, payload);
  }

  login(payload: LoginPayload): Observable<User> {
    return this.http.post<TokenPair>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((tokenPair) => this.tokens.setTokens(tokenPair.access_token, tokenPair.refresh_token)),
      switchMap(() => this.loadCurrentUser())
    );
  }

  startDemo(language: PreferredLanguage): Observable<User> {
    return this.http.post<TokenPair>(`${this.baseUrl}/auth/demo`, { language }).pipe(
      tap((tokenPair) => this.tokens.setTokens(tokenPair.access_token, tokenPair.refresh_token)),
      switchMap(() => this.loadCurrentUser())
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        // El idioma guardado en el perfil manda: así se recuerda también
        // entrando desde otro dispositivo, no solo por localStorage.
        if (user.preferred_language !== this.language.current()) {
          this.language.use(user.preferred_language);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/reset-password`, {
      token,
      new_password: newPassword,
    });
  }

  logout(): void {
    this.tokens.clear();
    this.currentUser.set(null);
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    this.refreshInFlight$ = this.http
      .post<AccessTokenOnly>(`${this.baseUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        map((res) => res.access_token),
        tap((accessToken) => this.tokens.setAccessToken(accessToken)),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        }),
        shareReplay(1),
        finalize(() => {
          this.refreshInFlight$ = null;
        })
      );

    return this.refreshInFlight$;
  }

  bootstrap(): Observable<boolean> {
    if (!this.hasStoredSession()) {
      return of(false);
    }
    return this.loadCurrentUser().pipe(
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }
}
