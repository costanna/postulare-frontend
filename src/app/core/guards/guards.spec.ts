import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

type GuardResult = boolean | UrlTree;

describe('route guards', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  const run = (guard: typeof guestGuard): Observable<GuardResult> => {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as GuardResult | Observable<GuardResult> | Promise<GuardResult>;
    return isObservable(result) ? result : of(result as GuardResult);
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => httpMock.verify());

  describe('guestGuard', () => {
    it('lets anonymous visitors see the login screens', async () => {
      expect(await firstValueFrom(run(guestGuard))).toBeTrue();
    });

    it('redirects to the dashboard when the stored session loads a real user', async () => {
      TestBed.inject(TokenStorageService).setTokens('access', 'refresh');
      const result = firstValueFrom(run(guestGuard));

      httpMock
        .expectOne(`${environment.apiUrl}/auth/me`)
        .flush({ id: '1', email: 'a@a.com', preferred_language: 'es', skills: [] });

      const redirect = (await result) as UrlTree;
      expect(redirect.toString()).toBe('/dashboard');
    });

    it('does NOT redirect when the server is unreachable (avoids a redirect loop with authGuard)', async () => {
      TestBed.inject(TokenStorageService).setTokens('access', 'refresh');
      const result = firstValueFrom(run(guestGuard));

      httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush('down', { status: 502, statusText: 'Bad Gateway' });

      expect(await result).toBeTrue();
    });
  });

  describe('authGuard', () => {
    it('sends visitors without a session to the login', async () => {
      expect(await firstValueFrom(run(authGuard))).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('lets in a stored session that loads a user', async () => {
      TestBed.inject(TokenStorageService).setTokens('access', 'refresh');
      const result = firstValueFrom(run(authGuard));

      httpMock
        .expectOne(`${environment.apiUrl}/auth/me`)
        .flush({ id: '1', email: 'a@a.com', preferred_language: 'es', skills: [] });

      expect(await result).toBeTrue();
    });
  });
});
