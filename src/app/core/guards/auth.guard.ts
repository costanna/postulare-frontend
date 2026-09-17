import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

/** Protege las rutas privadas. Si hay tokens guardados pero el usuario aún
 * no se ha cargado (p. ej. recarga de página), intenta cargarlo antes de
 * decidir; si el token ya no es válido, redirige a login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  if (!auth.hasStoredSession()) {
    router.navigate(['/auth/login']);
    return false;
  }

  return auth.loadCurrentUser().pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};
