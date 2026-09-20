import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, TokenStorageService, provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('login stores tokens and loads the current user', () => {
    let resolvedUser: unknown;
    service.login({ email: 'ana@example.com', password: 'supersecret123' }).subscribe((user) => (resolvedUser = user));

    const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    loginReq.flush({ access_token: 'access-1', refresh_token: 'refresh-1', token_type: 'bearer' });

    const meReq = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    meReq.flush({ id: '1', email: 'ana@example.com', preferred_language: 'es', skills: [] });

    expect(service.isAuthenticated()).toBeTrue();
    expect((resolvedUser as { email: string }).email).toBe('ana@example.com');
    expect(service.getAccessToken()).toBe('access-1');
  });

  it('logout clears tokens and the current user', () => {
    service.login({ email: 'a@a.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
    });
    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush({ id: '1', email: 'a@a.com', preferred_language: 'es', skills: [] });

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getAccessToken()).toBeNull();
  });

  it('refreshAccessToken updates the stored access token', () => {
    service.login({ email: 'a@a.com', password: 'x' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      access_token: 'old-access',
      refresh_token: 'refresh-1',
      token_type: 'bearer',
    });
    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush({ id: '1', email: 'a@a.com', preferred_language: 'es', skills: [] });

    let newToken: string | undefined;
    service.refreshAccessToken().subscribe((token) => (newToken = token));

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReq.request.body).toEqual({ refresh_token: 'refresh-1' });
    refreshReq.flush({ access_token: 'new-access', token_type: 'bearer' });

    expect(newToken).toBe('new-access');
    expect(service.getAccessToken()).toBe('new-access');
  });

  it('bootstrap resolves false immediately when there is no stored session', (done) => {
    service.bootstrap().subscribe((restored) => {
      expect(restored).toBeFalse();
      done();
    });
  });

  it('startDemo() creates the temporary account in the given language, stores tokens and loads the user', () => {
    let demoUser: { is_demo: boolean } | undefined;
    service.startDemo('ca').subscribe((user) => (demoUser = user));

    const demoReq = httpMock.expectOne(`${environment.apiUrl}/auth/demo`);
    expect(demoReq.request.method).toBe('POST');
    expect(demoReq.request.body).toEqual({ language: 'ca' });
    demoReq.flush({ access_token: 'demo-access', refresh_token: 'demo-refresh', token_type: 'bearer' });

    httpMock
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({ id: '1', email: 'demo-1@example.com', preferred_language: 'ca', skills: [], is_demo: true });

    expect(service.getAccessToken()).toBe('demo-access');
    expect(service.currentUser()?.is_demo).toBeTrue();
    expect(demoUser?.is_demo).toBeTrue();
  });
});
