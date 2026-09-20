import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [ProfileService] });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('importCv() uploads the PDF as multipart form data under the "file" field', () => {
    const file = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' });
    service.importCv(file).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/profile/import-cv`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('file')).toEqual(file);
    req.flush({ skills: [] });
  });
});
