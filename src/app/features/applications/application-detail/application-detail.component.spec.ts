import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Application, ApplicationStatus } from '../../../core/models/application.model';
import { ApplicationEvent } from '../../../core/models/event.model';
import { ApplyFlowService } from '../../../core/services/apply-flow.service';
import { ApplicationDetailComponent } from './application-detail.component';

const API = environment.apiUrl;

function application(status: ApplicationStatus, extra: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    user_id: 'u1',
    company_name: 'Acme',
    position: 'Dev',
    status,
    source: null,
    salary_range: null,
    job_url: 'https://jobs.example.com/1',
    notes: null,
    applied_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...extra,
  };
}

function event(type: ApplicationEvent['type'], description: string | null): ApplicationEvent {
  return { id: 'e1', application_id: 'a1', type, description, event_date: '2026-01-02T00:00:00Z' };
}

describe('ApplicationDetailComponent', () => {
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let httpMock: HttpTestingController;
  let applyFlow: ApplyFlowService;

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
    applyFlow = TestBed.inject(ApplyFlowService);
  });

  afterEach(() => httpMock.verify());

  function load(app: Application): void {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/applications/a1`).flush(app);
    httpMock.expectOne(`${API}/applications/a1/events`).flush([]);
    fixture.detectChanges();
  }

  const applyButton = () => fixture.nativeElement.querySelector('.detail-header__apply');

  it('has no "mark as applied" button any more', () => {
    load(application('saved'));
    expect(fixture.nativeElement.querySelector('.detail-header__mark-applied')).toBeNull();
  });

  it('offers "Apply" only for saved applications that have an offer page', () => {
    load(application('saved'));
    expect(applyButton()).not.toBeNull();
  });

  it('hides "Apply" when the application is not saved anymore', () => {
    load(application('interview', { applied_at: '2026-01-15' }));
    expect(applyButton()).toBeNull();
  });

  it('hides "Apply" when there is no offer page to open', () => {
    load(application('saved', { job_url: null }));
    expect(applyButton()).toBeNull();
  });

  it('apply() opens the offer page and, if you confirm, shows the applied application and reloads the timeline', () => {
    load(application('saved'));
    const open = spyOn(applyFlow, 'openOffer').and.returnValue(true);
    spyOn(applyFlow, 'confirmApplied').and.returnValue(of(application('applied', { applied_at: '2026-03-04' })));

    fixture.componentInstance.apply();

    expect(open).toHaveBeenCalledWith('https://jobs.example.com/1');
    expect(fixture.componentInstance.application()?.status).toBe('applied');
    httpMock.expectOne(`${API}/applications/a1/events`).flush([event('status_change', 'saved → applied')]);
  });

  it('apply() leaves the application saved when you answer "not yet"', () => {
    load(application('saved'));
    spyOn(applyFlow, 'openOffer').and.returnValue(true);
    spyOn(applyFlow, 'confirmApplied').and.returnValue(of(null));

    fixture.componentInstance.apply();

    expect(fixture.componentInstance.application()?.status).toBe('saved');
    httpMock.expectNone(`${API}/applications/a1/events`);
  });

  it('apply() still asks the question when the browser blocked the new tab', () => {
    load(application('saved'));
    spyOn(applyFlow, 'openOffer').and.returnValue(false);
    const confirm = spyOn(applyFlow, 'confirmApplied').and.returnValue(of(null));

    fixture.componentInstance.apply();

    expect(confirm).toHaveBeenCalled();
  });

  it('eventText() translates status changes and leaves other descriptions untouched', () => {
    load(application('applied', { applied_at: '2026-01-15' }));
    const component = fixture.componentInstance;

    expect(component.eventText(event('note', 'Llamada con RRHH'))).toBe('Llamada con RRHH');
    expect(component.eventText(event('note', null))).toBe('');
    expect(component.eventText(event('status_change', 'saved → applied'))).toBe('status.saved → status.applied');
    expect(component.eventText(event('status_change', 'texto libre'))).toBe('texto libre');
  });
});
