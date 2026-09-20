import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { FollowUp } from '../../core/models/application.model';
import { DashboardComponent } from './dashboard.component';

const API = environment.apiUrl;

function followUp(id: string, company: string, days: number): FollowUp {
  return {
    application: {
      id,
      user_id: 'u1',
      company_name: company,
      position: 'Dev',
      status: 'applied',
      source: null,
      salary_range: null,
      job_url: null,
      notes: null,
      applied_at: '2026-01-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    days_waiting: days,
    last_activity: '2026-01-01',
  };
}

describe('DashboardComponent follow-ups', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideRouter([]), provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function flushStats(): void {
    httpMock.expectOne(`${API}/stats/summary`).flush({
      total_applications: 3,
      total_applied: 3,
      total_interviews: 0,
      total_offers: 0,
      total_rejected: 0,
      response_rate: 0,
    });
    httpMock.expectOne(`${API}/stats/by-status`).flush([]);
    httpMock.expectOne(`${API}/stats/timeline`).flush([]);
    httpMock.expectOne(`${API}/stats/by-source`).flush([]);
  }

  it('shows the follow-up reminders returned by the API', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/applications/follow-ups`).flush([followUp('a1', 'Nubelia', 12), followUp('a2', 'Cobalto', 8)]);
    flushStats();
    fixture.detectChanges();

    expect(fixture.componentInstance.followUps().length).toBe(2);
    const items = fixture.nativeElement.querySelectorAll('.follow-ups__item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Nubelia');
  });

  it('does not render the card when nothing is due', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/applications/follow-ups`).flush([]);
    flushStats();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.follow-ups')).toBeNull();
  });

  it('still renders the dashboard when the follow-ups request fails', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/applications/follow-ups`).flush('boom', { status: 500, statusText: 'Server Error' });
    flushStats();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.stat-tiles')).not.toBeNull();
  });

  it('markFollowedUp() records a follow_up event and removes the reminder', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/applications/follow-ups`).flush([followUp('a1', 'Nubelia', 12), followUp('a2', 'Cobalto', 8)]);
    flushStats();

    fixture.componentInstance.markFollowedUp(fixture.componentInstance.followUps()[0]);

    const req = httpMock.expectOne(`${API}/applications/a1/events`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.type).toBe('follow_up');
    // Mientras se guarda, no se puede pulsar dos veces
    fixture.componentInstance.markFollowedUp(fixture.componentInstance.followUps()[0]);
    httpMock.expectNone(`${API}/applications/a1/events`);

    req.flush({ id: 'e1', application_id: 'a1', type: 'follow_up', description: null, event_date: '2026-02-01T00:00:00Z' });

    expect(fixture.componentInstance.followUps().map((f) => f.application.id)).toEqual(['a2']);
    expect(fixture.componentInstance.followingUpIds().size).toBe(0);
  });

  it('keeps the reminder when saving the follow-up fails', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/applications/follow-ups`).flush([followUp('a1', 'Nubelia', 12)]);
    flushStats();

    fixture.componentInstance.markFollowedUp(fixture.componentInstance.followUps()[0]);
    httpMock.expectOne(`${API}/applications/a1/events`).flush('x', { status: 500, statusText: 'Server Error' });

    expect(fixture.componentInstance.followUps().length).toBe(1);
    expect(fixture.componentInstance.followingUpIds().size).toBe(0);
  });
});
