import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Match } from '../../core/models/match.model';
import { ApplyFlowService } from '../../core/services/apply-flow.service';
import { MatchesComponent } from './matches.component';

const API = environment.apiUrl;

function match(id: string): Match {
  return {
    id,
    score: 80,
    reasoning: null,
    status: 'new',
    created_at: '2026-01-01T00:00:00Z',
    job_offer: {
      id: `o-${id}`,
      source: 'adzuna',
      title: 'Angular Dev',
      company_name: 'TechCorp',
      location: null,
      description: null,
      salary_range: null,
      url: null,
      fetched_at: '2026-01-01T00:00:00Z',
    },
    cover_letter: null,
    cover_letter_source: null,
    cover_letter_language: null,
    cover_letter_at: null,
    already_tracked: false,
  };
}

describe('MatchesComponent convert actions', () => {
  let fixture: ComponentFixture<MatchesComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideRouter([]), provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    }).compileComponents();
    fixture = TestBed.createComponent(MatchesComponent);
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${API}/matches` && r.params.get('status') === 'new').flush([match('m1'), match('m2')]);
    httpMock.expectOne(`${API}/matches/filters`).flush({
      filters: { keywords: null, location: null, radius_km: 30, exclude: null, exclude_other_levels: true, disability: 'any', max_days_old: null, min_score: 0 },
      effective_query: 'angular',
      effective_location: null,
      daily_remaining: null,
    });
  });

  afterEach(() => httpMock.verify());

  it('"Convert" saves the offer without claiming you applied', () => {
    fixture.componentInstance.convert(fixture.componentInstance.matches()[0]);
    const req = httpMock.expectOne(`${API}/matches/m1/convert`);
    expect(req.request.body).toEqual({});
    req.flush({});
    expect(fixture.componentInstance.matches().map((m) => m.id)).toEqual(['m2']);
  });

  describe('apply', () => {
    let applyFlow: ApplyFlowService;

    beforeEach(() => {
      applyFlow = TestBed.inject(ApplyFlowService);
    });

    const offerWithUrl = () => ({
      ...fixture.componentInstance.matches()[0],
      job_offer: { ...fixture.componentInstance.matches()[0].job_offer, url: 'https://jobs.example.com/1' },
    });

    it('opens the offer page, saves it as an application (not as applied) and then asks whether you applied', () => {
      const open = spyOn(applyFlow, 'openOffer').and.returnValue(true);
      const confirm = spyOn(applyFlow, 'confirmApplied').and.returnValue(of(null));

      fixture.componentInstance.apply(offerWithUrl());

      expect(open).toHaveBeenCalledWith('https://jobs.example.com/1');
      const req = httpMock.expectOne(`${API}/matches/m1/convert`);
      expect(req.request.body).toEqual({});
      expect(confirm).not.toHaveBeenCalled();
      req.flush({ id: 'a1', company_name: 'TechCorp', position: 'Angular Dev', status: 'saved' });

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(confirm.calls.mostRecent().args[0].id).toBe('a1');
      expect(fixture.componentInstance.matches().map((m) => m.id)).toEqual(['m2']);
      expect(fixture.componentInstance.convertingIds().size).toBe(0);
    });

    it('opens the page BEFORE the request finishes, so the browser does not treat it as a popup', () => {
      const order: string[] = [];
      spyOn(applyFlow, 'openOffer').and.callFake(() => (order.push('open'), true));
      spyOn(applyFlow, 'confirmApplied').and.returnValue(of(null));

      fixture.componentInstance.apply(offerWithUrl());
      order.push('request pending');
      httpMock.expectOne(`${API}/matches/m1/convert`).flush({ id: 'a1' });

      expect(order).toEqual(['open', 'request pending']);
    });

    it('still saves the offer when the browser blocks the new tab', () => {
      spyOn(applyFlow, 'openOffer').and.returnValue(false);
      spyOn(applyFlow, 'confirmApplied').and.returnValue(of(null));

      fixture.componentInstance.apply(offerWithUrl());
      httpMock.expectOne(`${API}/matches/m1/convert`).flush({ id: 'a1' });

      expect(fixture.componentInstance.matches().map((m) => m.id)).toEqual(['m2']);
    });

    it('does not ask anything when saving fails, and keeps the card', () => {
      spyOn(applyFlow, 'openOffer').and.returnValue(true);
      const confirm = spyOn(applyFlow, 'confirmApplied');

      fixture.componentInstance.apply(offerWithUrl());
      httpMock.expectOne(`${API}/matches/m1/convert`).flush('x', { status: 409, statusText: 'Conflict' });

      expect(confirm).not.toHaveBeenCalled();
      expect(fixture.componentInstance.matches().length).toBe(2);
      expect(fixture.componentInstance.convertingIds().size).toBe(0);
    });

    it('shows Apply, Save and Dismiss on each new card and no "mark as applied"', () => {
      fixture.detectChanges();
      const labels = Array.from<HTMLButtonElement>(
        fixture.nativeElement.querySelectorAll('.match-card:first-child .match-card__buttons button')
      ).map((b) => b.textContent?.trim());
      expect(labels.length).toBe(3);
      expect(labels).toContain('matches.apply_button');
      expect(labels.join(' ')).not.toContain('applied_button');
    });
  });

  describe('keyword suggestions', () => {
    const control = () => fixture.componentInstance.searchForm.controls.keywords;

    it('picking a suggestion appends it to the keywords and marks the form as changed', () => {
      control().setValue('angular');
      fixture.componentInstance.toggleKeyword('React');
      expect(control().value).toBe('angular React');
      expect(control().dirty).toBeTrue();
    });

    it('picking a selected one removes it, ignoring case and separators', () => {
      control().setValue('angular, react   node.js');
      fixture.componentInstance.toggleKeyword('REACT');
      expect(control().value).toBe('angular node.js');
    });

    it('the highlighted suggestions follow what is typed in the field', () => {
      control().setValue('Docker python');
      expect(fixture.componentInstance.keywordSelection()).toEqual(['Docker', 'python']);
    });

    it('renders the suggestion list inside the filters panel', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.search-filters app-keyword-suggestions')).not.toBeNull();
    });
  });

  it('labels each offer with the site it came from', () => {
    expect(fixture.componentInstance.sourceLabel('infojobs')).toBe('InfoJobs');
    expect(fixture.componentInstance.sourceLabel('adzuna')).toBe('Adzuna');
    expect(fixture.componentInstance.sourceLabel('otra')).toBe('otra');
  });

  describe('disability filter', () => {
    it('is off by default', () => {
      expect(fixture.componentInstance.searchForm.controls.disability.value).toBe('any');
    });

    it('is saved with the rest of the filters', () => {
      fixture.componentInstance.searchForm.controls.disability.setValue('require');
      fixture.componentInstance.saveFilters();
      const req = httpMock.expectOne(`${API}/matches/filters`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.disability).toBe('require');
      req.flush({ filters: { ...req.request.body }, effective_query: 'angular', effective_location: null, daily_remaining: null });
      expect(fixture.componentInstance.searchForm.controls.disability.value).toBe('require');
    });

    it('older saved filters without the field load as "any"', () => {
      fixture.componentInstance.searchForm.controls.disability.setValue('exclude');
      fixture.componentInstance.resetFilters();
      const req = httpMock.expectOne(`${API}/matches/filters`);
      expect(req.request.body.disability).toBe('any');
      const { disability: _omitted, ...withoutField } = req.request.body;
      req.flush({ filters: withoutField, effective_query: '', effective_location: null, daily_remaining: null });
      expect(fixture.componentInstance.searchForm.controls.disability.value).toBe('any');
    });

    it('offers the three choices in the filters panel', () => {
      expect(fixture.componentInstance.disabilityOptions).toEqual(['any', 'require', 'exclude']);
    });
  });
});
