import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'postulare-access-token';
const REFRESH_TOKEN_KEY = 'postulare-refresh-token';

/** Centraliza el acceso a localStorage para los tokens JWT. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return this.read(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.read(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.write(ACCESS_TOKEN_KEY, accessToken);
    this.write(REFRESH_TOKEN_KEY, refreshToken);
  }

  setAccessToken(accessToken: string): void {
    this.write(ACCESS_TOKEN_KEY, accessToken);
  }

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // no-op
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage no disponible; la sesión no persistirá entre recargas.
    }
  }
}
