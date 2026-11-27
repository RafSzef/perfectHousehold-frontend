import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Functional HTTP Interceptor.
 * Automatically attaches the JWT Bearer token to outgoing requests and
 * clears stale sessions when protected API calls respond with 401 Unauthorized.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const authReq =
    token && !req.headers.has('Authorization')
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !req.url.includes('/api/auth/login') &&
        !req.url.includes('/api/auth/me')
      ) {
        authService.handleUnauthorized(router.url);
      }
      return throwError(() => err);
    }),
  );
};
