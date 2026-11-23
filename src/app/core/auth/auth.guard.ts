import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Requires a valid session. Waits for /api/auth/me after page refresh.
 * Not logged in -> redirect to /login (with returnUrl).
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadCurrentUser().pipe(
    map((user) =>
      user ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
    )
  );
};

/**
 * Requires ROLE_ADMIN. Non-admin -> redirect to /profile.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadCurrentUser().pipe(
    map(() => (authService.isAdmin() ? true : router.createUrlTree(['/profile'])))
  );
};

/**
 * For /login: already logged-in users are sent to /profile.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadCurrentUser().pipe(
    map((user) => (user ? router.createUrlTree(['/profile']) : true))
  );
};
