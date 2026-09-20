import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

/** Para las pantallas de auth (login, registro...): si ya hay sesión, fuera de aquí.
 * Una sesión guardada solo cuenta si el usuario se puede cargar: con el servidor caído
 * (Render tarda en despertar) redirigir por el mero token provocaba un bucle con authGuard. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const dashboard = router.createUrlTree(['/dashboard']);

  if (auth.isAuthenticated()) {
    return dashboard;
  }
  if (!auth.hasStoredSession()) {
    return true;
  }
  return auth.loadCurrentUser().pipe(
    map(() => dashboard),
    catchError(() => of(true))
  );
};
