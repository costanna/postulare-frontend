import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  let service: MatchesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/matches`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MatchesService],
    });
    service = TestBed.inject(MatchesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getFilters() GETs /matches/filters', () => {
    service.getFilters().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/filters`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('saveFilters() PUTs the filters to /matches/filters', () => {
    const filters = {
      keywords: 'angular react',
      location: null,
      radius_km: 50,
      exclude: 'php',
      exclude_other_levels: true,
      max_days_old: 14,
      min_score: 30,
    };
    service.saveFilters(filters).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/filters`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(filters);
    req.flush({});
  });

  it('search() POSTs to /matches/search with an empty body', () => {
    service.search().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/search`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ fetched: 0, new_matches: 0, updated_matches: 0 });
  });

  it('list() defaults to limit=50 and omits the status filter when not given', () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('limit') === '50');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('status')).toBeFalse();
    req.flush([]);
  });

  it('list() forwards the status filter and a custom limit', () => {
    service.list('new', 10).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('status') === 'new' && r.params.get('limit') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('convert() POSTs to /matches/{id}/convert', () => {
    service.convert('match-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/match-1/convert`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('dismiss() POSTs to /matches/{id}/dismiss', () => {
    service.dismiss('match-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/match-1/dismiss`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
