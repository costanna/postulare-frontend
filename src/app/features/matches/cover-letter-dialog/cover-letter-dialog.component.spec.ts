import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../../environments/environment';
import { CoverLetter, Match } from '../../../core/models/match.model';
import { CoverLetterDialogComponent } from './cover-letter-dialog.component';

const MATCH = {
  id: 'm1',
  score: 80,
  reasoning: null,
  status: 'new',
  created_at: '2026-01-01T00:00:00Z',
  job_offer: { id: 'o1', title: 'Angular Dev', company_name: 'TechCorp' },
  cover_letter: null,
  cover_letter_source: null,
  cover_letter_at: null,
  already_tracked: false,
} as unknown as Match;

const URL = `${environment.apiUrl}/matches/m1/cover-letter`;

function letter(overrides: Partial<CoverLetter> = {}): CoverLetter {
  return {
    cover_letter: 'Hola equipo',
    source: 'template',
    generated_at: '2026-01-01T00:00:00Z',
    template_reason: 'no_key',
    ai_available: false,
    ai_remaining: null,
    ...overrides,
  };
}

describe('CoverLetterDialogComponent', () => {
  let fixture: ComponentFixture<CoverLetterDialogComponent>;
  let httpMock: HttpTestingController;
  const dialogRef = { close: jasmine.createSpy('close') };

  beforeEach(async () => {
    dialogRef.close.calls.reset();
    await TestBed.configureTestingModule({
      imports: [CoverLetterDialogComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        provideTranslateService({ lang: 'es', fallbackLang: 'es' }),
        { provide: MAT_DIALOG_DATA, useValue: { match: MATCH } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoverLetterDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the letter on open (without forcing a regeneration) and shows it in the editor', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.regenerate).toBeFalse();
    expect(fixture.componentInstance.loading()).toBeTrue();

    req.flush(letter());
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.text.value).toBe('Hola equipo');
    expect(fixture.nativeElement.querySelector('textarea').value).toBe('Hola equipo');
    expect(fixture.nativeElement.querySelector('.letter__notice')).not.toBeNull();
  });

  it('marks AI letters and shows the remaining daily quota instead of the template notice', () => {
    fixture.detectChanges();
    httpMock.expectOne(URL).flush(
      letter({ source: 'ai', template_reason: null, ai_available: true, ai_remaining: 3 })
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.letter__source--ai')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.letter__notice')).toBeNull();
    expect(fixture.nativeElement.querySelector('.letter__quota')).not.toBeNull();
  });

  it('changing the language regenerates the letter in that language', () => {
    fixture.detectChanges();
    httpMock.expectOne(URL).flush(letter());

    fixture.componentInstance.changeLanguage('en');
    const req = httpMock.expectOne(URL);
    expect(req.request.body).toEqual({ language: 'en', regenerate: true });
    req.flush(letter({ cover_letter: 'Hello team' }));

    expect(fixture.componentInstance.text.value).toBe('Hello team');
  });

  it('shows an error with retry when the request fails, and recovers on retry', () => {
    fixture.detectChanges();
    httpMock.expectOne(URL).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.failed()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.letter__error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();

    fixture.componentInstance.generate(false);
    httpMock.expectOne(URL).flush(letter());
    expect(fixture.componentInstance.failed()).toBeFalse();
  });

  it('copies the (possibly edited) text and flags it as copied for a moment', fakeAsync(() => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText } as unknown as Clipboard);

    fixture.detectChanges();
    httpMock.expectOne(URL).flush(letter());
    fixture.componentInstance.text.setValue('Texto editado por la usuaria');

    fixture.componentInstance.copy();
    tick();
    expect(writeText).toHaveBeenCalledWith('Texto editado por la usuaria');
    expect(fixture.componentInstance.copied()).toBeTrue();

    tick(2000);
    expect(fixture.componentInstance.copied()).toBeFalse();
  }));

  it('closing returns the generated letter so the card can reflect it', () => {
    fixture.detectChanges();
    const generated = letter({ cover_letter: 'Guardada' });
    httpMock.expectOne(URL).flush(generated);

    fixture.componentInstance.close();
    expect(dialogRef.close).toHaveBeenCalledWith(generated);
  });
});
