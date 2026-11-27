import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserService } from '../../core/services/user.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  function setup() {
    const authService = {
      currentUser: signal({
        id: 1,
        username: 'jan',
        email: 'jan@dom.pl',
        role: 'ROLE_USER',
        enabled: true,
      }),
      isAdmin: signal(false),
      logout: vi.fn(),
    };
    const themeService = {
      isDark: signal(true),
      toggleTheme: vi.fn(),
    };
    const userService = {
      changePassword: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ThemeService, useValue: themeService },
        { provide: UserService, useValue: userService },
      ],
    });

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, userService };
  }

  it('binds labels with input ids and validates blank passwords locally', () => {
    const { fixture, component, userService } = setup();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('label[for="current-password"]')).not.toBeNull();
    expect(el.querySelector('input#current-password')).not.toBeNull();
    expect(el.querySelector('label[for="new-password"]')).not.toBeNull();
    expect(el.querySelector('input#new-password')).not.toBeNull();

    component.onChangePassword();
    fixture.detectChanges();

    expect(userService.changePassword).not.toHaveBeenCalled();
    expect(component.passwordError()).toBe('Podaj aktualne oraz nowe hasło.');
    expect(component.passwordFieldErrors()).toEqual({
      currentPassword: 'Podaj aktualne hasło.',
      newPassword: 'Podaj nowe hasło.',
    });
  });

  it('displays translated RFC 9457 error when current password does not match', () => {
    const { fixture, component, userService } = setup();
    userService.changePassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              status: 400,
              title: 'Bad Request',
              detail: 'Current password does not match',
              type: 'https://perfecthousehold.local/errors/bad-request',
            },
          }),
      ),
    );

    component.currentPassword.set('wrong');
    component.newPassword.set('newSecret123');
    component.onChangePassword();
    fixture.detectChanges();

    expect(component.passwordError()).toBe('Aktualne hasło jest nieprawidłowe.');
    expect(component.passwordSuccess()).toBeNull();
  });

  it('resets form and shows success message on 204 No Content', () => {
    const { fixture, component, userService } = setup();
    userService.changePassword.mockReturnValue(of(void 0));

    component.currentPassword.set('oldSecret');
    component.newPassword.set('newSecret123');
    component.onChangePassword();
    fixture.detectChanges();

    expect(userService.changePassword).toHaveBeenCalledWith('oldSecret', 'newSecret123');
    expect(component.passwordSuccess()).toBe('Hasło zostało pomyślnie zaktualizowane!');
    expect(component.passwordError()).toBeNull();
    expect(component.currentPassword()).toBe('');
    expect(component.newPassword()).toBe('');
  });
});
