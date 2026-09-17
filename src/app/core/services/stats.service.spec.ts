import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/stats`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StatsService],
    });
    service = TestBed.inject(StatsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getSummary() fetches /stats/summary', () => {
    service.getSummary().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/summary`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getByStatus() fetches /stats/by-status', () => {
    service.getByStatus().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/by-status`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTimeline() fetches /stats/timeline', () => {
    service.getTimeline().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/timeline`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getBySource() fetches /stats/by-source and accepts a null source', () => {
    let result: unknown;
    service.getBySource().subscribe((sources) => (result = sources));
    const req = httpMock.expectOne(`${baseUrl}/by-source`);
    expect(req.request.method).toBe('GET');
    req.flush([{ source: null, count: 3 }]);

    expect(result).toEqual([{ source: null, count: 3 }]);
  });
});
