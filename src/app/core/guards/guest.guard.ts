import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Para las pantallas de auth (login, registro...): si ya hay sesión, fuera de aquí. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() || auth.hasStoredSession()) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
