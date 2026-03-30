import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2'; // Asegúrate de tenerlo importado

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false
})
export class LoginComponent {
  loginData = {
    email: '',
    password: ''
  };

  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (!this.loginData.email || !this.loginData.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos para continuar.',
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;

        let title = 'Error';
        let message = 'Hubo un problema de conexión con el servidor.';

        // --- AQUÍ ESTÁ LA MAGIA DE REDIS ---
        if (err.status === 429) {
          title = 'Cuenta Bloqueada';
          message = 'Has excedido el número de intentos permitidos. Por seguridad, tu cuenta ha sido bloqueada temporalmente por 15 minutos.';
        } else if (err.status === 401) {
          title = 'Acceso Denegado';
          message = 'El correo o la contraseña son incorrectos. Por favor, verifica tus credenciales.';
        } else if (err.status === 403) {
          title = 'Sin Permisos';
          message = 'El usuario no pertenece a esta organización.';
        } else if (err.status === 0) {
          title = 'Sin Conexión';
          message = 'No se pudo establecer comunicación con el servidor. Revisa tu conexión a internet.';
        }

        Swal.fire({
          icon: 'error',
          title: title,
          text: message,
          confirmButtonColor: '#1e3a8a',
          confirmButtonText: 'Reintentar'
        }).then(() => {
          this.cdr.detectChanges();
        });

        console.error('Error detallado:', err);
      }
    });
  }
}