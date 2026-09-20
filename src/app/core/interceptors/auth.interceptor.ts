import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { isExpiringSoon } from '../utils/jwt';

const AUTH_FREE_PATHS = ['/auth/login', '/auth/register', '/auth/demo', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

function isAuthFreePath(url: string): boolean {
  return AUTH_FREE_PATHS.some((path) => url.includes(path));
}

/** Añade el access token a las peticiones a nuestra API. Si está a punto de caducar (o ya caducó) lo renueva
 * ANTES de enviar, para no provocar un 401 visible en la consola; y si aun así el backend responde 401,
 * lo renueva una vez y repite la petición. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Lo que no es de nuestra API (p. ej. los JSON de traducciones en
  // /assets/i18n) no lleva token ni refresco: se deja pasar sin ni siquiera
  // resolver AuthService. Es necesario para evitar un ciclo de inyección al
  // arrancar: AuthService -> LanguageService -> TranslateService -> loader
  // HTTP -> HttpClient -> este interceptor -> AuthService.
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const shouldAttachToken = !isAuthFreePath(req.url);

  const withToken = (token: string) => req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  const endSession = (error: unknown) => {
    auth.logout();
    router.navigate(['/auth/login']);
    return throwError(() => error);
  };

  const send = (token: string | null): Observable<HttpEvent<unknown>> =>
    next(shouldAttachToken && token ? withToken(token) : req).pipe(
      catchError((error: unknown) => {
        const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
        if (!isUnauthorized || !shouldAttachToken) {
          return throwError(() => error);
        }
        return auth.refreshAccessToken().pipe(
          switchMap((fresh) => next(withToken(fresh))),
          catchError(endSession)
        );
      })
    );

  const current = auth.getAccessToken();
  if (shouldAttachToken && current && isExpiringSoon(current)) {
    return auth.refreshAccessToken().pipe(
      catchError(endSession),
      switchMap((fresh) => send(fresh))
    );
  }
  return send(current);
};
