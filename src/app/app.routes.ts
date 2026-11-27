import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Logowanie - perfectHousehold',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/admin/users/users.component').then((m) => m.UsersComponent),
    canActivate: [authGuard, adminGuard],
    title: 'Użytkownicy - perfectHousehold',
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'Moje Konto - perfectHousehold',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile',
  },
  {
    path: '**',
    redirectTo: 'profile',
  },
];
