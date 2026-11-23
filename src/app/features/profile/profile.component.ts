import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
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

  onChangePassword(): void {
    if (!this.currentPassword() || !this.newPassword()) {
      this.passwordError.set('Podaj aktualne oraz nowe hasło.');
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    this.userService.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordSuccess.set('Hasło zostało pomyślnie zaktualizowane!');
        this.currentPassword.set('');
        this.newPassword.set('');
      },
      error: (err: any) => {
        this.isChangingPassword.set(false);
        this.passwordError.set(err.error?.message || 'Błąd podczas zmiany hasła. Upewnij się, że aktualne hasło jest poprawne.');
      },
    });
  }
}
