import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideTranslateService } from '@ngx-translate/core';

import { routes } from './app.routes';
import { resolveInitialLanguage, FALLBACK_LANGUAGE } from './core/i18n/supported-languages';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { FocusSafeMatDialog } from './core/services/focus-safe-dialog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    { provide: MatDialog, useClass: FocusSafeMatDialog },
    provideHttpClient(withInterceptors([authInterceptor])),
    // El loader HTTP tiene que pasarse DENTRO de la config de
    // provideTranslateService: si va como proveedor suelto, el
    // TranslateNoOpLoader que registra por defecto lo pisa (gana el
    // último proveedor del token) y no se llega a pedir ningún JSON -
    // el pipe `translate` acaba mostrando las claves tal cual.
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
      lang: resolveInitialLanguage(),
      fallbackLang: FALLBACK_LANGUAGE,
    }),
  ],
};
