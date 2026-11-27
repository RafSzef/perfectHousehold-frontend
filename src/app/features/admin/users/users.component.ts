import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { parseHttpError } from '../../../core/http/problem-detail';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);

  users = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal / Form state for creating a user
  showAddUserModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  modalErrorMessage = signal<string | null>(null);
  modalFieldErrors = signal<Record<string, string>>({});

  newUser: Partial<User> = {
    username: '',
    email: '',
    password: '',
    role: 'ROLE_USER',
    enabled: true,
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService.getAllUsers().subscribe({
      next: (list) => {
        this.users.set(list);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const parsed = parseHttpError(err, {
          fallbackMessage: 'Nie udało się pobrać listy użytkowników.',
          statusMessages: {
            403: 'Brak uprawnień. Tylko użytkownicy z rolą ROLE_ADMIN mogą przeglądać listę użytkowników.',
          },
        });
        this.errorMessage.set(parsed.message);
      },
    });
  }

  openAddModal(): void {
    this.newUser = {
      username: '',
      email: '',
      password: '',
      role: 'ROLE_USER',
      enabled: true,
    };
    this.modalErrorMessage.set(null);
    this.modalFieldErrors.set({});
    this.successMessage.set(null);
    this.showAddUserModal.set(true);
  }

  closeAddModal(): void {
    if (this.isSubmitting()) {
      return;
    }
    this.showAddUserModal.set(false);
    this.modalErrorMessage.set(null);
    this.modalFieldErrors.set({});
  }

  onEscapeKey(): void {
    if (this.showAddUserModal()) {
      this.closeAddModal();
    }
  }

  onSaveUser(): void {
    const username = (this.newUser.username ?? '').trim();
    const email = (this.newUser.email ?? '').trim();
    const password = this.newUser.password ?? '';

    const fieldErrors: Record<string, string> = {};
    if (!username) {
      fieldErrors['username'] = 'Login nie może być pusty.';
    }
    if (!email) {
      fieldErrors['email'] = 'Adres e-mail nie może być pusty.';
    } else if (!EMAIL_PATTERN.test(email)) {
      fieldErrors['email'] = 'Podaj poprawny adres e-mail.';
    }
    if (!password.trim()) {
      fieldErrors['passwordHash'] = 'Hasło nie może być puste.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      this.modalFieldErrors.set(fieldErrors);
      this.modalErrorMessage.set('Popraw zaznaczone pola formularza.');
      return;
    }

    this.newUser.username = username;
    this.newUser.email = email;
    this.isSubmitting.set(true);
    this.modalErrorMessage.set(null);
    this.modalFieldErrors.set({});

    this.userService
      .registerUser({
        ...this.newUser,
        username,
        email,
        password,
      })
      .subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.showAddUserModal.set(false);
          this.successMessage.set(`Użytkownik "${created.username}" został pomyślnie utworzony!`);
          this.loadUsers();
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          const parsed = parseHttpError(err, {
            fallbackMessage: 'Nie udało się utworzyć użytkownika.',
            statusMessages: {
              403: 'Brak uprawnień do utworzenia nowego użytkownika.',
            },
          });
          this.modalFieldErrors.set(parsed.fieldErrors);
          this.modalErrorMessage.set(parsed.message);
        },
      });
  }
}
