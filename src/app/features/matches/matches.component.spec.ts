import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { Match } from '../../core/models/match.model';
import { todayIso } from '../../core/utils/iso-date';
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

  it('"I applied" creates the application as sent, with the local date', () => {
    fixture.componentInstance.convert(fixture.componentInstance.matches()[0], true);
    const req = httpMock.expectOne(`${API}/matches/m1/convert`);
    expect(req.request.body).toEqual({ applied: true, applied_at: todayIso() });
    req.flush({});
    expect(fixture.componentInstance.matches().map((m) => m.id)).toEqual(['m2']);
    expect(fixture.componentInstance.convertingIds().size).toBe(0);
  });

  it('keeps the card and re-enables the buttons when converting fails', () => {
    fixture.componentInstance.convert(fixture.componentInstance.matches()[0], true);
    httpMock.expectOne(`${API}/matches/m1/convert`).flush('x', { status: 409, statusText: 'Conflict' });
    expect(fixture.componentInstance.matches().length).toBe(2);
    expect(fixture.componentInstance.convertingIds().size).toBe(0);
  });

  it('renders both actions on each new card', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.match-card:first-child .match-card__buttons button');
    expect(buttons.length).toBe(3);
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
