import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const TOKEN_KEY = 'ph_auth_token';

  function setup(initialToken: string | null = null) {
    localStorage.clear();
    if (initialToken) {
      localStorage.setItem(TOKEN_KEY, initialToken);
    }

    const router = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    return { service, httpMock, router };
  }

  afterEach(() => {
    localStorage.clear();
  });

  it('clears session on 401 from /api/auth/me', () => {
    const { service, httpMock } = setup('expired-jwt');
    let result: unknown = 'unset';

    service.loadCurrentUser().subscribe((user) => {
      result = user;
    });

    const req = httpMock.expectOne('/api/auth/me');
    req.flush({ status: 401, detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(result).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    httpMock.verify();
  });

  it('preserves token on transient 503 error from /api/auth/me and allows retry', () => {
    const { service, httpMock } = setup('valid-jwt');
    let firstResult: unknown = 'unset';

    service.loadCurrentUser().subscribe((user) => {
      firstResult = user;
    });

    const firstReq = httpMock.expectOne('/api/auth/me');
    firstReq.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(firstResult).toBeNull();
    expect(service.getToken()).toBe('valid-jwt');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('valid-jwt');

    let secondResult: unknown = null;
    service.loadCurrentUser().subscribe((user) => {
      secondResult = user;
    });

    const secondReq = httpMock.expectOne('/api/auth/me');
    secondReq.flush({ id: 1, username: 'jan', role: 'ROLE_USER', enabled: true });

    expect(secondResult).toEqual({ id: 1, username: 'jan', role: 'ROLE_USER', enabled: true });
    httpMock.verify();
  });

  it('handleUnauthorized clears session and redirects to /login with safe returnUrl', () => {
    const { service, router } = setup('stale-jwt');

    service.handleUnauthorized('/users');

    expect(service.getToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/users' },
    });
  });

  it('handleUnauthorized rejects unsafe returnUrl and redirects cleanly to /login', () => {
    const { service, router } = setup('stale-jwt');

    service.handleUnauthorized('https://evil.example.com');

    expect(service.getToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/profile' },
    });
  });
});
