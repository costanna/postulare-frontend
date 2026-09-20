import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { CV_MAX_BYTES, ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        provideTranslateService({ lang: 'es', fallbackLang: 'es' }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the profile and fills the form', () => {
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/profile`).flush({
      id: '1',
      email: 'ana@example.com',
      full_name: 'Ana',
      skills: ['Angular', 'Python'],
      location: 'Barcelona',
      desired_position: 'Junior Full Stack Developer',
      seniority: 'junior',
      min_salary: 24000,
      preferred_language: 'es',
      created_at: '2026-01-01T00:00:00Z',
    });

    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.skills()).toEqual(['Angular', 'Python']);
    expect(fixture.componentInstance.form.value.location).toBe('Barcelona');
  });

  it('adds and removes skills', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/profile`).flush({
      id: '1',
      email: 'a@a.com',
      full_name: null,
      skills: [],
      location: null,
      desired_position: null,
      seniority: null,
      min_salary: null,
      preferred_language: 'es',
      created_at: '2026-01-01T00:00:00Z',
    });

    const component = fixture.componentInstance;
    component.addSkill({ value: 'Docker', chipInput: { clear: () => undefined } } as never);
    expect(component.skills()).toEqual(['Docker']);

    component.removeSkill('Docker');
    expect(component.skills()).toEqual([]);
  });

  it('submits the updated profile', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/profile`).flush({
      id: '1',
      email: 'a@a.com',
      full_name: null,
      skills: [],
      location: null,
      desired_position: null,
      seniority: null,
      min_salary: null,
      preferred_language: 'es',
      created_at: '2026-01-01T00:00:00Z',
    });

    fixture.componentInstance.form.patchValue({ location: 'Madrid' });
    fixture.componentInstance.submit();

    const patchReq = httpMock.expectOne(`${environment.apiUrl}/profile`);
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body.location).toBe('Madrid');
    patchReq.flush({
      id: '1',
      email: 'a@a.com',
      full_name: null,
      skills: [],
      location: 'Madrid',
      desired_position: null,
      seniority: null,
      min_salary: null,
      preferred_language: 'es',
      created_at: '2026-01-01T00:00:00Z',
    });

    expect(fixture.componentInstance.saving()).toBeFalse();
  });

  describe('CV import', () => {
    const IMPORT_URL = `${environment.apiUrl}/profile/import-cv`;

    function loadProfile(): void {
      fixture.detectChanges();
      httpMock.expectOne(`${environment.apiUrl}/profile`).flush({
        id: '1',
        email: 'a@a.com',
        full_name: 'Ana',
        skills: ['Docker', 'python', 'Cobol'],
        location: 'Madrid',
        desired_position: null,
        seniority: null,
        min_salary: null,
        preferred_language: 'es',
        about: null,
        is_demo: false,
        created_at: '2026-01-01T00:00:00Z',
      });
    }

    function pick(file: File): void {
      const input = { files: [file], value: 'C:\fakepath\cv.pdf' };
      fixture.componentInstance.onCvSelected({ target: input } as unknown as Event);
      expect(input.value).toBe('');
    }

    const pdf = () => new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' });

    it('rejects files that are not PDFs without calling the API', () => {
      loadProfile();
      pick(new File(['hola'], 'cv.docx'));
      httpMock.expectNone(IMPORT_URL);
      expect(fixture.componentInstance.importError()).toBe('profile.import_error_not_pdf');
    });

    it('rejects oversized PDFs without calling the API', () => {
      loadProfile();
      pick(new File([new Uint8Array(CV_MAX_BYTES + 1)], 'cv.pdf'));
      httpMock.expectNone(IMPORT_URL);
      expect(fixture.componentInstance.importError()).toBe('profile.import_error_size');
    });

    it('fills the form with the proposal but does NOT save it', () => {
      loadProfile();
      pick(pdf());
      httpMock.expectOne(IMPORT_URL).flush({
        full_name: 'Laura Ejemplo',
        desired_position: 'Full Stack Developer',
        location: 'Girona',
        seniority: 'junior',
        skills: ['Python', 'Angular', 'Docker'],
        about: 'Resumen del CV',
      });

      const component = fixture.componentInstance;
      expect(component.importing()).toBeFalse();
      expect(component.cvApplied()).toBeTrue();
      expect(component.form.value.desired_position).toBe('Full Stack Developer');
      expect(component.form.value.location).toBe('Girona');
      expect(component.form.value.seniority).toBe('junior');
      expect(component.form.value.about).toBe('Resumen del CV');
      expect(component.form.dirty).toBeTrue();
      expect(component.form.value.full_name).toBe('Ana');
      // (httpMock.verify() en afterEach garantiza que no se ha hecho ningún PATCH)
    });

    it('puts the CV skills first, keeps the manual ones and does not duplicate (case-insensitive)', () => {
      loadProfile();
      pick(pdf());
      httpMock.expectOne(IMPORT_URL).flush({
        full_name: null,
        desired_position: null,
        location: null,
        seniority: null,
        skills: ['Python', 'Angular', 'Docker'],
        about: null,
      });

      // "python" ya estaba (en minúsculas): sale una sola vez, con la forma del CV
      expect(fixture.componentInstance.skills()).toEqual(['Python', 'Angular', 'Docker', 'Cobol']);
    });

    it('keeps the current values when the CV does not provide a field', () => {
      loadProfile();
      pick(pdf());
      httpMock.expectOne(IMPORT_URL).flush({
        full_name: null,
        desired_position: null,
        location: null,
        seniority: null,
        skills: [],
        about: null,
      });

      expect(fixture.componentInstance.form.value.location).toBe('Madrid');
      expect(fixture.componentInstance.form.value.full_name).toBe('Ana');
    });

    it('maps API failures to a specific message', () => {
      const cases: [number, string][] = [
        [413, 'profile.import_error_size'],
        [415, 'profile.import_error_not_pdf'],
        [422, 'profile.import_error_no_text'],
        [429, 'auth.error_too_many_requests'],
        [500, 'common.error_generic'],
      ];
      loadProfile();
      for (const [status, key] of cases) {
        pick(pdf());
        httpMock.expectOne(IMPORT_URL).flush({ detail: 'x' }, { status, statusText: 'Error' });
        expect(fixture.componentInstance.importError()).toBe(key);
        expect(fixture.componentInstance.importing()).toBeFalse();
        expect(fixture.componentInstance.cvApplied()).toBeFalse();
      }
    });

    it('sends the professional summary when saving', () => {
      loadProfile();
      fixture.componentInstance.form.patchValue({ about: '  Me gusta el frontend  ' });
      fixture.componentInstance.submit();
      const req = httpMock.expectOne(`${environment.apiUrl}/profile`);
      expect(req.request.body.about).toBe('Me gusta el frontend');
      req.flush({});
    });
  });
});
