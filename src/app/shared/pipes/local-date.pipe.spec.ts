import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { LanguageService } from '../../core/services/language.service';
import { LocalDatePipe } from './local-date.pipe';

describe('LocalDatePipe', () => {
  let pipe: LocalDatePipe;
  let language: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LocalDatePipe, provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    });
    pipe = TestBed.inject(LocalDatePipe);
    language = TestBed.inject(LanguageService);
  });

  it('devuelve cadena vacía para null/undefined/vacío', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('no desplaza el día en YYYY-MM-DD (se interpreta en horario local, no UTC)', () => {
    language.current.set('en');
    // Si se parseara como UTC, en zonas UTC negativas saldría el 29.
    expect(pipe.transform('2026-07-30')).toContain('30');
  });

  it('formatea según el idioma activo', () => {
    language.current.set('en');
    const english = pipe.transform('2026-07-30');
    language.current.set('es');
    const spanish = pipe.transform('2026-07-30');

    expect(english).toContain('Jul');
    expect(spanish.toLowerCase()).toContain('jul');
    expect(english).not.toBe(spanish);
  });

  it('acepta fechas ISO con hora', () => {
    language.current.set('en');
    expect(pipe.transform('2026-09-20T10:15:00Z')).toContain('2026');
  });

  it('devuelve el valor tal cual si no es una fecha válida', () => {
    expect(pipe.transform('no-es-fecha')).toBe('no-es-fecha');
  });
});
