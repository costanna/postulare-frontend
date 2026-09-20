import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { appConfig } from './app.config';

describe('appConfig (i18n)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
  });

  it('carga las traducciones por HTTP desde /assets/i18n', () => {
    // Regresión: con `provideTranslateHttpLoader(...)` como proveedor suelto,
    // el TranslateNoOpLoader que registra provideTranslateService lo pisaba;
    // no se pedía ningún JSON y toda la UI mostraba las claves ("auth.login.title").
    TestBed.inject(TranslateService);
    const httpMock = TestBed.inject(HttpTestingController);

    const requests = httpMock.match((req) => req.url.startsWith('/assets/i18n/') && req.url.endsWith('.json'));

    expect(requests.length).toBeGreaterThan(0);
    requests.forEach((req) => req.flush({}));
    httpMock.verify();
  });
});
