import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  function setup() {
    const userService = {
      getAllUsers: vi.fn().mockReturnValue(of([])),
      registerUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [{ provide: UserService, useValue: userService }],
    });

    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, userService };
  }

  it('moves focus to username input when add-user modal opens', async () => {
    const { fixture, component } = setup();

    component.openAddModal();
    fixture.detectChanges();
    await Promise.resolve();

    const usernameInput = (fixture.nativeElement as HTMLElement).querySelector(
      '#new-user-username',
    );
    expect(document.activeElement).toBe(usernameInput);
  });

  it('validates blank fields and email format inside modal without calling backend', () => {
    const { fixture, component, userService } = setup();
    component.openAddModal();
    component.newUser = {
      username: '   ',
      email: 'not-an-email',
      password: '   ',
      role: 'ROLE_USER',
    };

    component.onSaveUser();
    fixture.detectChanges();

    expect(userService.registerUser).not.toHaveBeenCalled();
    expect(component.modalErrorMessage()).toBe('Popraw zaznaczone pola formularza.');
    expect(component.modalFieldErrors()['username']).toBeTruthy();
    expect(component.modalFieldErrors()['email']).toBeTruthy();
    expect(component.modalFieldErrors()['passwordHash']).toBeTruthy();

    const modalCard = (fixture.nativeElement as HTMLElement).querySelector('.modal-card');
    expect(modalCard?.getAttribute('role')).toBe('dialog');
    expect(modalCard?.getAttribute('aria-modal')).toBe('true');
    expect(modalCard?.textContent).toContain('Popraw zaznaczone pola formularza.');
  });

  it('trims username and email before submitting and displays 409 Conflict detail in modal', () => {
    const { fixture, component, userService } = setup();
    userService.registerUser.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              status: 409,
              title: 'Conflict',
              detail: 'Username is already taken: jan',
              type: 'https://perfecthousehold.local/errors/conflict',
            },
          }),
      ),
    );

    component.openAddModal();
    component.newUser = {
      username: '  jan  ',
      email: '  jan@dom.pl  ',
      password: 'secret',
      role: 'ROLE_USER',
    };

    component.onSaveUser();
    fixture.detectChanges();

    expect(userService.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'jan',
        email: 'jan@dom.pl',
        password: 'secret',
      }),
    );
    expect(component.modalErrorMessage()).toBe('Nazwa użytkownika "jan" jest już zajęta.');
    expect(component.errorMessage()).toBeNull();
  });

  it('maps RFC 9457 @Valid field errors (including passwordHash) inside modal', () => {
    const { fixture, component, userService } = setup();
    userService.registerUser.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              status: 400,
              title: 'Validation Failed',
              detail: 'One or more fields failed validation.',
              errors: {
                username: 'Username must not be blank',
                email: 'Email must be valid',
                passwordHash: 'Password must not be blank',
              },
            },
          }),
      ),
    );

    component.openAddModal();
    component.newUser = {
      username: 'jan',
      email: 'jan@dom.pl',
      password: 'secret',
      role: 'ROLE_USER',
    };

    component.onSaveUser();
    fixture.detectChanges();

    const modalCard = (fixture.nativeElement as HTMLElement).querySelector('.modal-card');
    expect(modalCard?.textContent).toContain('Nazwa użytkownika nie może być pusta.');
    expect(modalCard?.textContent).toContain('Podaj poprawny adres e-mail.');
    expect(modalCard?.textContent).toContain('Hasło nie może być puste.');
  });
});
