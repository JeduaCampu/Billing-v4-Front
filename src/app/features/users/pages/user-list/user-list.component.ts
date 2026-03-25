import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../services/user.service';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  role_id: string;
  tenant_id: string;
  createdAt: string;
  updatedAt: string;
  role: {
    name: string;
    description: string;
  };
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  standalone: false
})
export class UserListComponent implements OnInit {
  isLoading = true;
  users: User[] = [];

  showModal = false;
  selectedUserId: string | null = null;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.users = res.data || [];
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
          this.isLoading = false;
        }
      });
  }

  openModal(id: string | null = null): void {
    this.selectedUserId = id;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(data: any): void {
    this.showModal = false;
    this.selectedUserId = null;

    if (data && typeof data === 'object' && data.id) {
      this.handleUserUpdateLocally(data);
    }
    else if (data === true) {
      this.loadUsers();
    }

    this.cdr.detectChanges();
  }

  private handleUserUpdateLocally(userData: User): void {
    const index = this.users.findIndex(u => u.id === userData.id);

    if (index !== -1) {
      this.users[index] = { ...userData };
    } else {
      this.users = [userData, ...this.users];
    }
    this.cdr.detectChanges();
  }

  deleteUser(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará el acceso del usuario permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== id);
            this.cdr.detectChanges();
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire('Error', err.error?.error?.message || 'No se pudo eliminar', 'error');
          }
        });
      }
    });
  }
}