import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { sanitizeReturnUrl } from '../../../core/auth/return-url';
import { parseHttpError } from '../../../core/http/problem-detail';
import { LoginRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  fieldErrors = signal<Record<string, string>>({});
  isLoading = signal<boolean>(false);

  onSubmit(): void {
    const username = this.credentials.username.trim();
    const password = this.credentials.password;

    const validationErrors: Record<string, string> = {};
    if (!username) {
      validationErrors['username'] = 'Podaj nazwę użytkownika.';
    }
    if (!password.trim()) {
      validationErrors['password'] = 'Podaj hasło.';
    }

    if (Object.keys(validationErrors).length > 0) {
      this.fieldErrors.set(validationErrors);
      this.errorMessage.set('Podaj nazwę użytkownika oraz hasło.');
      return;
    }

    this.credentials.username = username;
    this.errorMessage.set(null);
    this.fieldErrors.set({});
    this.isLoading.set(true);

    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const parsed = parseHttpError(err, {
          fallbackMessage: 'Wystąpił błąd podczas logowania. Spróbuj ponownie.',
          statusMessages: {
            401: 'Niepoprawny login lub hasło.',
            403: 'Niepoprawny login lub hasło.',
          },
        });
        this.fieldErrors.set(parsed.fieldErrors);
        this.errorMessage.set(parsed.message);
      },
    });
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }
}
