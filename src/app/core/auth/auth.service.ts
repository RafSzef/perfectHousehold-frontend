import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'ph_auth_token';

  // Reactive state (Angular Signals)
  readonly token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  readonly currentUser = signal<User | null>(null);

  // Derived state
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'ROLE_ADMIN' || role === 'ADMIN';
  });

  // Cached in-flight /me request, so guards and components share a single call
  private userRequest$: Observable<User | null> | null = null;

  /**
   * Log in:
   * 1. POST /api/auth/login -> JWT (accessToken)
   * 2. store token
   * 3. GET /api/auth/me -> current user
   */
  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      map((res) => res.accessToken || res.token),
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('Backend nie zwrócił tokena.'));
        }
        this.saveToken(token);
        this.userRequest$ = null;
        return this.loadCurrentUser();
      }),
      map((user) => {
        if (!user) {
          throw new Error('Nie udało się pobrać profilu użytkownika.');
        }
        return user;
      })
    );
  }

  /**
   * Ensures current user is loaded (used by guards after page refresh).
   * Returns null if there is no valid session.
   */
  loadCurrentUser(): Observable<User | null> {
    if (!this.token()) {
      return of(null);
    }
    if (this.currentUser()) {
      return of(this.currentUser());
    }
    if (!this.userRequest$) {
      this.userRequest$ = this.http.get<User>('/api/auth/me').pipe(
        tap((user) => this.currentUser.set(user)),
        catchError(() => {
          // Invalid / expired token -> clear session
          this.clearSession();
          return of(null);
        }),
        shareReplay(1)
      );
    }
    return this.userRequest$;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.token.set(token);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.userRequest$ = null;
  }
}
