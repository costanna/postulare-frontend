import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/applications`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApplicationsService],
    });
    service = TestBed.inject(ApplicationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() sends page and page_size by default, with no optional filters', () => {
    service.list().subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('page') === '1' && r.params.get('page_size') === '20'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('status')).toBeFalse();
    expect(req.request.params.has('company')).toBeFalse();
    req.flush({ items: [], total: 0, page: 1, page_size: 20, pages: 0 });
  });

  it('list() forwards status, company and date filters as query params', () => {
    service
      .list({ status: 'interview', company: 'Acme', date_from: '2026-01-01', date_to: '2026-01-31', page: 2, page_size: 10 })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('status') === 'interview' &&
        r.params.get('company') === 'Acme' &&
        r.params.get('date_from') === '2026-01-01' &&
        r.params.get('date_to') === '2026-01-31' &&
        r.params.get('page') === '2' &&
        r.params.get('page_size') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 2, page_size: 10, pages: 0 });
  });

  it('get() fetches a single application by id', () => {
    service.get('app-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/app-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() POSTs the payload to the base url', () => {
    const payload = { company_name: 'Acme', position: 'Dev', status: 'saved' as const };
    service.create(payload).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('update() PATCHes the given id with only the provided fields', () => {
    service.update('app-1', { status: 'offer' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/app-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'offer' });
    req.flush({});
  });

  it('delete() DELETEs the given id', () => {
    service.delete('app-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/app-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('followUps() GETs /applications/follow-ups', () => {
    service.followUps().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/follow-ups`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('exportCsv() GETs /applications/export as a blob', () => {
    let received: Blob | undefined;
    service.exportCsv().subscribe((blob) => (received = blob));
    const req = httpMock.expectOne(`${baseUrl}/export`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['company,position\n'], { type: 'text/csv' }));
    expect(received?.type).toBe('text/csv');
  });
});
