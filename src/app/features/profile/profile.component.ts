import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { parseHttpError } from '../../core/http/problem-detail';
import { ThemeService } from '../../core/services/theme.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly userService = inject(UserService);

  // Change password form
  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  isChangingPassword = signal<boolean>(false);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  passwordFieldErrors = signal<Record<string, string>>({});

  onChangePassword(): void {
    const current = this.currentPassword();
    const next = this.newPassword();

    const validationErrors: Record<string, string> = {};
    if (!current.trim()) {
      validationErrors['currentPassword'] = 'Podaj aktualne hasło.';
    }
    if (!next.trim()) {
      validationErrors['newPassword'] = 'Podaj nowe hasło.';
    }

    if (Object.keys(validationErrors).length > 0) {
      this.passwordFieldErrors.set(validationErrors);
      this.passwordError.set('Podaj aktualne oraz nowe hasło.');
      this.passwordSuccess.set(null);
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordError.set(null);
    this.passwordFieldErrors.set({});
    this.passwordSuccess.set(null);

    this.userService.changePassword(current, next).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordSuccess.set('Hasło zostało pomyślnie zaktualizowane!');
        this.currentPassword.set('');
        this.newPassword.set('');
      },
      error: (err: unknown) => {
        this.isChangingPassword.set(false);
        const parsed = parseHttpError(err, {
          fallbackMessage:
            'Błąd podczas zmiany hasła. Upewnij się, że aktualne hasło jest poprawne.',
        });
        this.passwordFieldErrors.set(parsed.fieldErrors);
        this.passwordError.set(parsed.message);
      },
    });
  }
}
