import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  function setup(token: string | null = 'jwt-token', routerUrl = '/users') {
    const authService = {
      getToken: vi.fn().mockReturnValue(token),
      handleUnauthorized: vi.fn(),
    };
    const router = {
      url: routerUrl,
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    return { http, httpMock, authService };
  }

  it('attaches Authorization Bearer header when token is present', () => {
    const { http, httpMock } = setup('my-secret-jwt');

    http.get('/api/users').subscribe();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-secret-jwt');
    req.flush([]);
    httpMock.verify();
  });

  it('calls handleUnauthorized on 401 from protected endpoint', () => {
    const { http, httpMock, authService } = setup('expired-jwt', '/users');
    let errored = false;

    http.get('/api/users').subscribe({
      error: () => {
        errored = true;
      },
    });

    const req = httpMock.expectOne('/api/users');
    req.flush({ status: 401, detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(errored).toBe(true);
    expect(authService.handleUnauthorized).toHaveBeenCalledWith('/users');
    httpMock.verify();
  });

  it('does not call handleUnauthorized on 401 from /api/auth/login', () => {
    const { http, httpMock, authService } = setup(null, '/login');

    http.post('/api/auth/login', { username: 'jan', password: 'bad' }).subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ status: 401, detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.handleUnauthorized).not.toHaveBeenCalled();
    httpMock.verify();
  });
});
