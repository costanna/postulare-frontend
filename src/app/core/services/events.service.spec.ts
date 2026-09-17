import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EventsService],
    });
    service = TestBed.inject(EventsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() fetches the events of an application', () => {
    service.list('app-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/applications/app-1/events`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create() POSTs the payload under the application', () => {
    const payload = { type: 'note' as const, description: 'Llamada de seguimiento' };
    service.create('app-1', payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/applications/app-1/events`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('delete() DELETEs by event id, not by application id', () => {
    service.delete('event-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/events/event-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
