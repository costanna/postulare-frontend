import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { fakeJwt } from '../utils/fake-jwt.testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function setup(authFactory: () => Partial<AuthService>): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useFactory: authFactory },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock.verify());

  it('no resuelve AuthService para peticiones que no son de la API (p. ej. los JSON de traducciones)', () => {
    // Regresión: al arrancar, TranslateService pide /assets/i18n/*.json a
    // través de HttpClient; si el interceptor resolvía AuthService aquí, se
    // cerraba el ciclo AuthService -> LanguageService -> TranslateService
    // -> HttpClient -> interceptor y las traducciones no cargaban nunca.
    setup(() => {
      throw new Error('AuthService no debería resolverse para peticiones ajenas a la API');
    });

    http.get('/assets/i18n/es.json').subscribe();

    const req = httpMock.expectOne('/assets/i18n/es.json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('añade el access token a las peticiones a la API', () => {
    setup(() => ({ getAccessToken: () => 'token-123' }));

    http.get(`${environment.apiUrl}/applications`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/applications`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it('no añade token a los endpoints de auth', () => {
    setup(() => ({ getAccessToken: () => 'token-123' }));

    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  describe('token renewal', () => {
    const url = `${environment.apiUrl}/applications`;

    it('renews a token that is about to expire BEFORE sending, so the server never answers 401', () => {
      const refresh = jasmine.createSpy('refresh').and.returnValue(of('fresh-token'));
      setup(() => ({ getAccessToken: () => fakeJwt(5), refreshAccessToken: refresh }));

      http.get(url).subscribe();

      const req = httpMock.expectOne(url);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(req.request.headers.get('Authorization')).toBe('Bearer fresh-token');
      req.flush({});
    });

    it('does not renew a token that still has time', () => {
      const refresh = jasmine.createSpy('refresh');
      const token = fakeJwt(600);
      setup(() => ({ getAccessToken: () => token, refreshAccessToken: refresh }));

      http.get(url).subscribe();

      const req = httpMock.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      expect(refresh).not.toHaveBeenCalled();
      req.flush({});
    });

    it('sends unreadable tokens as they are and lets the server decide', () => {
      const refresh = jasmine.createSpy('refresh');
      setup(() => ({ getAccessToken: () => 'opaque', refreshAccessToken: refresh }));
      http.get(url).subscribe();
      expect(httpMock.expectOne(url).request.headers.get('Authorization')).toBe('Bearer opaque');
      expect(refresh).not.toHaveBeenCalled();
    });

    it('ends the session and goes to the login when the renewal fails', () => {
      const logout = jasmine.createSpy('logout');
      setup(() => ({
        getAccessToken: () => fakeJwt(-10),
        refreshAccessToken: () => throwError(() => new Error('refresh expired')),
        logout,
      }));
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      let failed = false;

      http.get(url).subscribe({ error: () => (failed = true) });

      httpMock.expectNone(url);
      expect(failed).toBeTrue();
      expect(logout).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('a normal server error after the renewal does not log the user out', () => {
      const logout = jasmine.createSpy('logout');
      setup(() => ({ getAccessToken: () => fakeJwt(1), refreshAccessToken: () => of('fresh'), logout }));
      let status = 0;

      http.get(url).subscribe({ error: (e) => (status = e.status) });
      httpMock.expectOne(url).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(status).toBe(500);
      expect(logout).not.toHaveBeenCalled();
    });

    it('still recovers from a surprise 401 by renewing once and retrying', () => {
      const refresh = jasmine.createSpy('refresh').and.returnValue(of('fresh'));
      setup(() => ({ getAccessToken: () => fakeJwt(600), refreshAccessToken: refresh }));
      let body: unknown;

      http.get(url).subscribe((res) => (body = res));
      httpMock.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
      const retry = httpMock.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh');
      retry.flush({ ok: true });

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(body).toEqual({ ok: true });
    });
  });
});
