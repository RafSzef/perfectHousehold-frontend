import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { ProfileComponent } from './features/profile/profile.component';
import { UsersComponent } from './features/admin/users/users.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Logowanie - perfectHousehold',
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [authGuard, adminGuard],
    title: 'Użytkownicy - perfectHousehold',
  },
  {
    path: 'profile',
    component: ProfileComponent,
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
