import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  /**
   * Get all registered users. Only accessible by users with ROLE_ADMIN.
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  /**
   * Register a new user into the system. Only accessible by users with ROLE_ADMIN.
   */
  registerUser(user: Partial<User>): Observable<User> {
    const payload = {
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash || user.password,
      role: user.role || 'ROLE_USER',
    };
    return this.http.post<User>('/api/auth/register', payload);
  }

  /**
   * Change current user's password.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
}
