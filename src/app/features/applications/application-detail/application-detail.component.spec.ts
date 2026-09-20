import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../../environments/environment';
import { Application, ApplicationStatus } from '../../../core/models/application.model';
import { ApplicationEvent } from '../../../core/models/event.model';
import { todayIso } from '../../../core/utils/iso-date';
import { ApplicationDetailComponent } from './application-detail.component';

const API = environment.apiUrl;

function application(status: ApplicationStatus, appliedAt: string | null = null): Application {
  return {
    id: 'a1',
    user_id: 'u1',
    company_name: 'Acme',
    position: 'Dev',
    status,
    source: null,
    salary_range: null,
    job_url: null,
    notes: null,
    applied_at: appliedAt,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function event(type: ApplicationEvent['type'], description: string | null): ApplicationEvent {
  return { id: 'e1', application_id: 'a1', type, description, event_date: '2026-01-02T00:00:00Z' };
}

describe('ApplicationDetailComponent', () => {
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es', fallbackLang: 'es' }),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'a1' }) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationDetailComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function load(app: Application): void {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/applications/a1`).flush(app);
    httpMock.expectOne(`${API}/applications/a1/events`).flush([]);
    fixture.detectChanges();
  }

  it('offers "I applied" only while the application is still saved', () => {
    load(application('saved'));
    expect(fixture.nativeElement.querySelector('.detail-header__actions .mat-mdc-unelevated-button')).not.toBeNull();
  });

  it('hides "I applied" once it is not saved anymore', () => {
    load(application('interview', '2026-01-15'));
    expect(fixture.nativeElement.querySelector('.detail-header__actions .mat-mdc-unelevated-button')).toBeNull();
  });

  it('markApplied() sends status + local date, shows the result and reloads the timeline', () => {
    load(application('saved'));

    fixture.componentInstance.markApplied();
    fixture.componentInstance.markApplied();
    const req = httpMock.expectOne(`${API}/applications/a1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'applied', applied_at: todayIso() });
    req.flush(application('applied', todayIso()));

    expect(fixture.componentInstance.application()?.status).toBe('applied');
    expect(fixture.componentInstance.markingApplied()).toBeFalse();
    httpMock.expectOne(`${API}/applications/a1/events`).flush([event('status_change', 'saved → applied')]);
  });

  it('markApplied() keeps the error state recoverable', () => {
    load(application('saved'));
    fixture.componentInstance.markApplied();
    httpMock.expectOne(`${API}/applications/a1`).flush('x', { status: 500, statusText: 'Server Error' });

    expect(fixture.componentInstance.application()?.status).toBe('saved');
    expect(fixture.componentInstance.markingApplied()).toBeFalse();
  });

  it('eventText() translates status changes and leaves other descriptions untouched', () => {
    load(application('applied', '2026-01-15'));
    const component = fixture.componentInstance;

    expect(component.eventText(event('note', 'Llamada con RRHH'))).toBe('Llamada con RRHH');
    expect(component.eventText(event('note', null))).toBe('');
    // Sin traducciones cargadas, ngx-translate devuelve la clave: comprueba que se traducen ambos estados
    expect(component.eventText(event('status_change', 'saved → applied'))).toBe('status.saved → status.applied');
    expect(component.eventText(event('status_change', 'texto libre'))).toBe('texto libre');
  });
});
