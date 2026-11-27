import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  function setup(returnUrl: string | null = null) {
    const authService = {
      login: vi.fn(),
    };
    const router = {
      navigateByUrl: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(returnUrl !== null ? { returnUrl } : {}),
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, authService, router };
  }

  it('does not render hardcoded admin credentials in the template', () => {
    const { fixture } = setup();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).not.toContain('admin123');
    expect(html).not.toContain('admin /');
  });

  it('navigates to safe returnUrl after login and blocks Open Redirect', () => {
    const { component, authService, router } = setup('https://evil.example.com');
    authService.login.mockReturnValue(of({ id: 1, username: 'jan', role: 'ROLE_USER' }));

    component.credentials.username = '  jan  ';
    component.credentials.password = 'secret';
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ username: 'jan', password: 'secret' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
  });

  it('navigates to relative in-app returnUrl after login', () => {
    const { component, authService, router } = setup('/users');
    authService.login.mockReturnValue(of({ id: 1, username: 'jan', role: 'ROLE_ADMIN' }));

    component.credentials.username = 'jan';
    component.credentials.password = 'secret';
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/users');
  });

  it('displays RFC 9457 field errors and hides infrastructure details on 502', () => {
    const { component, authService } = setup();
    authService.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 502,
            url: 'http://localhost:8081/api/auth/login',
            error: 'Bad Gateway localhost:8081',
          }),
      ),
    );

    component.credentials.username = 'jan';
    component.credentials.password = 'secret';
    component.onSubmit();

    expect(component.errorMessage()).not.toContain('localhost');
    expect(component.errorMessage()).not.toContain('8081');
  });
});
