import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  credentials: LoginRequest = {
    username: '',
    password: '',
  };

  showPassword = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage.set('Podaj nazwę użytkownika oraz hasło.');
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/profile';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.toMessage(err));
      },
    });
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  fillAdminCredentials(): void {
    this.credentials.username = 'admin';
    this.credentials.password = 'admin123';
  }

  private toMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 403) return 'Niepoprawny login lub hasło.';
      if (err.status === 0 || err.status === 502 || err.status === 504) {
        return 'Brak połączenia z backendem (localhost:8081). Czy jest uruchomiony?';
      }
      return err.error?.message || `Błąd serwera (${err.status}).`;
    }
    return err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.';
  }
}
