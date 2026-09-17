import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { ProfileComponent } from './profile.component';

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
});
