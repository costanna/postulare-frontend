import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Application } from '../models/application.model';
import { todayIso } from '../utils/iso-date';
import { ApplyFlowService } from './apply-flow.service';

const APPLICATION = {
  id: 'a1',
  company_name: 'Acme',
  position: 'Dev',
  status: 'saved',
} as Application;

describe('ApplyFlowService', () => {
  let service: ApplyFlowService;
  let httpMock: HttpTestingController;
  let afterClosed: unknown;
  let openSpy: jasmine.Spy;

  beforeEach(() => {
    afterClosed = of(true);
    openSpy = jasmine.createSpy('open').and.callFake(() => ({ afterClosed: () => afterClosed }));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: MatDialog, useValue: { open: openSpy } }],
    });
    service = TestBed.inject(ApplyFlowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('openOffer', () => {
    it('opens the offer in a new tab and detaches it from this window', () => {
      const tab = { opener: 'window' } as unknown as Window;
      const open = spyOn(window, 'open').and.returnValue(tab);

      expect(service.openOffer('https://jobs.example.com/1')).toBeTrue();

      expect(open).toHaveBeenCalledWith('https://jobs.example.com/1', '_blank');
      expect(tab.opener).toBeNull();
    });

    it('reports a blocked tab', () => {
      spyOn(window, 'open').and.returnValue(null);
      expect(service.openOffer('https://jobs.example.com/1')).toBeFalse();
    });

    it('does nothing (and is not an error) when the offer has no page', () => {
      const open = spyOn(window, 'open');
      expect(service.openOffer(null)).toBeTrue();
      expect(open).not.toHaveBeenCalled();
    });
  });

  describe('confirmApplied', () => {
    it('asks about the offer by name', () => {
      service.confirmApplied(APPLICATION).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/applications/a1`).flush({});

      expect(openSpy.calls.mostRecent().args[1].data).toEqual({ position: 'Dev', company: 'Acme' });
    });

    it('marks the application as applied today when you answer yes', () => {
      let result: Application | null | undefined;
      service.confirmApplied(APPLICATION).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${environment.apiUrl}/applications/a1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'applied', applied_at: todayIso() });
      req.flush({ ...APPLICATION, status: 'applied' });

      expect(result?.status).toBe('applied');
    });

    it('changes nothing when you answer "not yet"', () => {
      afterClosed = of(false);
      let result: Application | null | undefined;
      service.confirmApplied(APPLICATION).subscribe((r) => (result = r));

      httpMock.expectNone(`${environment.apiUrl}/applications/a1`);
      expect(result).toBeNull();
    });

    it('treats closing the dialog without answering as "not yet"', () => {
      afterClosed = of(undefined);
      let result: Application | null | undefined;
      service.confirmApplied(APPLICATION).subscribe((r) => (result = r));

      httpMock.expectNone(`${environment.apiUrl}/applications/a1`);
      expect(result).toBeNull();
    });
  });
});
