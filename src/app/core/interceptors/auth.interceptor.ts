import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const AUTH_FREE_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

function isAuthFreePath(url: string): boolean {
  return AUTH_FREE_PATHS.some((path) => url.includes(path));
}

/** Añade el access token a las peticiones a nuestra API y, si el backend
 * responde 401, intenta renovarlo una vez y repite la petición original. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const shouldAttachToken = isApiRequest(req.url) && !isAuthFreePath(req.url);
  const accessToken = auth.getAccessToken();

  const authorizedReq = shouldAttachToken && accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!isUnauthorized || !shouldAttachToken) {
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((newAccessToken) => {
          const retriedReq = req.clone({ setHeaders: { Authorization: `Bearer ${newAccessToken}` } });
          return next(retriedReq);
        }),
        catchError((refreshError) => {
          auth.logout();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
