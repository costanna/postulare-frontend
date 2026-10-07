import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

/** La demo no tiene ciertas secciones (p. ej. Espontáneas): redirige al dashboard. */
export const nonDemoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const decide = () => {
    if (auth.currentUser()?.is_demo) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  };

  if (auth.isAuthenticated()) {
    return decide();
  }

  if (!auth.hasStoredSession()) {
    router.navigate(['/auth/login']);
    return false;
  }

  return auth.loadCurrentUser().pipe(
    map(decide),
    catchError(() => {
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};
