import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AppLanguage, persistLanguage, resolveInitialLanguage } from '../i18n/supported-languages';

/**
 * Envuelve TranslateService: expone el idioma actual como signal y persiste
 * el cambio en localStorage. Cuando el usuario está autenticado, el
 * ProfileService sincroniza además `preferred_language` contra el backend
 * (para que el idioma se recuerde también entrando desde otro dispositivo).
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly current = signal<AppLanguage>(resolveInitialLanguage());

  use(lang: AppLanguage): void {
    this.current.set(lang);
    this.translate.use(lang);
    persistLanguage(lang);
  }
}
