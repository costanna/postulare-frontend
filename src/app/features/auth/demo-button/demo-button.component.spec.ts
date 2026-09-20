import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { DemoButtonComponent } from './demo-button.component';

describe('DemoButtonComponent', () => {
  let fixture: ComponentFixture<DemoButtonComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DemoButtonComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoButtonComponent);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function startWith(status?: number): void {
    fixture.componentInstance.start();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/demo`);
    if (status) {
      req.flush({ detail: 'x' }, { status, statusText: 'Error' });
      return;
    }
    req.flush({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' });
    httpMock
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({ id: '1', email: 'demo@example.com', preferred_language: 'es', skills: [], is_demo: true });
  }

  it('creates the demo account in the current UI language and goes to the dashboard', () => {
    TestBed.inject(LanguageService).use('ca');
    fixture.componentInstance.start();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/demo`);
    expect(req.request.body).toEqual({ language: 'ca' });
    req.flush({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' });
    httpMock
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({ id: '1', email: 'demo@example.com', preferred_language: 'ca', skills: [], is_demo: true });

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('ignores extra clicks while the account is being created', () => {
    fixture.componentInstance.start();
    fixture.componentInstance.start();
    const requests = httpMock.match(`${environment.apiUrl}/auth/demo`);
    expect(requests.length).toBe(1);
  });

  it('explains when the daily demo cap is reached (503) and lets the user retry', () => {
    startWith(503);
    expect(fixture.componentInstance.errorMessage()).toBe('auth.demo.error_unavailable');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('explains when too many demos were requested from this connection (429)', () => {
    startWith(429);
    expect(fixture.componentInstance.errorMessage()).toBe('auth.error_too_many_requests');
  });

  it('falls back to the generic error for any other failure', () => {
    startWith(500);
    expect(fixture.componentInstance.errorMessage()).toBe('common.error_generic');
  });

  it('clears the previous error on a new attempt', () => {
    startWith(500);
    startWith();
    expect(fixture.componentInstance.errorMessage()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
