import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/auth/auth.service';
import { User } from './core/models/user.model';

function createAuthServiceMock(user: User | null) {
  const currentUser = signal<User | null>(user);
  return {
    currentUser,
    isAuthenticated: signal<boolean>(user !== null),
    isAdmin: signal<boolean>(user?.role === 'ROLE_ADMIN'),
    logout: vi.fn(),
  };
}

describe('App', () => {
  it('should create the app and hide navbar when unauthenticated', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthServiceMock(null) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(compiled.querySelector('.app-navbar')).toBeNull();
    expect(compiled.querySelector('main.app-content-wrapper.no-nav')).not.toBeNull();
  });

  it('should render navbar and admin link for authenticated admin user', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: createAuthServiceMock({
            id: 1,
            username: 'jan',
            email: 'jan@dom.pl',
            role: 'ROLE_ADMIN',
            enabled: true,
          }),
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text')?.textContent).toContain('perfectHousehold');
    expect(compiled.querySelector('.pill-name')?.textContent?.trim()).toBe('jan');
    expect(compiled.querySelector('a[href="/users"]')).not.toBeNull();
    expect(compiled.querySelector('a[href="/profile"]')).not.toBeNull();
  });
});
