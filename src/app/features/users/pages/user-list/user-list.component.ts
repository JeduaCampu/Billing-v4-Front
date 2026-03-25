import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../services/user.service'; // Asegúrate que la ruta sea correcta
import { finalize } from 'rxjs/operators';

// 1. Interfaz actualizada según el JSON real del backend
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

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Carga los usuarios desde el backend
   */
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          // El backend responde con { data: [...] }
          this.users = res.data || [];
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
        }
      });
  }

  /**
   * Elimina un usuario llamando al servicio real
   */
  deleteUser(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          // Filtramos localmente para no recargar toda la lista
          this.users = this.users.filter(u => u.id !== id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.error?.error?.message || 'No se pudo eliminar el usuario');
          console.error('Error al eliminar:', err);
        }
      });
    }
  }
}