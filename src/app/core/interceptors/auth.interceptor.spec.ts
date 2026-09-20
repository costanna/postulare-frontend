import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
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
});
