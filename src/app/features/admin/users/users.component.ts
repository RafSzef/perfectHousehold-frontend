import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
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
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 403
            ? 'Brak uprawnień. Tylko użytkownicy z rolą ROLE_ADMIN mogą przeglądać listę użytkowników.'
            : 'Nie udało się pobrać listy użytkowników z backendu.'
        );
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
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showAddUserModal.set(true);
  }

  closeAddModal(): void {
    this.showAddUserModal.set(false);
  }

  onSaveUser(): void {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      this.errorMessage.set('Wypełnij wszystkie wymagane pola (login, email, hasło).');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.userService.registerUser(this.newUser).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.showAddUserModal.set(false);
        this.successMessage.set(`Użytkownik "${created.username}" został pomyślnie utworzony!`);
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.message || 'Błąd podczas tworzenia użytkownika. Być może login lub email jest już zajęty.'
        );
      },
    });
  }
}
