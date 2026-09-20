import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';

/**
 * Formatea fechas de la API (`YYYY-MM-DD` o ISO con hora) según el idioma
 * activo: "30 jul 2026" en catalán/castellano/inglés, en vez del ISO crudo.
 *
 * Es impura a propósito: tiene que reevaluarse al cambiar de idioma, y su
 * coste es un `Intl.DateTimeFormat` por celda - despreciable aquí.
 *
 * Los `YYYY-MM-DD` se construyen con sus partes en horario local; `new
 * Date("2026-07-30")` es medianoche UTC y en zonas UTC negativas mostraría
 * el día anterior.
 */
@Pipe({ name: 'localDate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | null | undefined): string {
    if (!value) return '';

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]) : new Date(value);
    if (isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(this.language.current(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
