import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false
})
export class LoginComponent {
  // Datos del formulario inicial
  loginData = {
    email: '',
    password: ''
  };

  // Variables para el flujo de MFA
  showMfa: boolean = false;
  mfaType: 'TOTP' | 'EMAIL' = 'TOTP';
  mfaCode: string = '';

  private tempUserId: string = '';
  private tempTenantId: string = '';

  // Estados de la UI
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  /**
   * Alterna la visibilidad de la contraseña en el input
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Paso 1: Intento de inicio de sesión inicial
   */
  onLogin(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.showWarning('Campos incompletos', 'Por favor, completa todos los campos.');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (res.mfaRequired) {
          this.showMfa = true;
          this.mfaType = res.mfaType;
          this.tempUserId = res.userId;
          this.tempTenantId = res.tenantId;

          this.cdr.detectChanges();
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.handleAuthError(err);
      }
    });
  }

  /**
   * Paso 2: Verificación del código de 6 dígitos (MFA)
   */
  onVerifyMfa(): void {
    if (this.mfaCode.length !== 6) return;

    this.isLoading = true;
    this.cdr.detectChanges();

    const verify$ = (this.mfaType === 'EMAIL')
      ? this.authService.verifyEmailMfa(this.tempUserId, this.mfaCode, this.tempTenantId)
      : this.authService.verifyMfa(this.tempUserId, this.mfaCode, this.tempTenantId);

    verify$.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Código Inválido',
          text: err.error?.message || 'El código de verificación es incorrecto o ya expiró.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Permite al usuario regresar al formulario de login si se equivocó
   */
  cancelMfa(): void {
    this.showMfa = false;
    this.mfaCode = '';
    this.tempUserId = '';
    this.tempTenantId = '';
    this.cdr.detectChanges();
  }

  /**
   * Centraliza el manejo de errores HTTP de autenticación
   */
  private handleAuthError(err: any): void {
    let title = 'Error';
    let message = 'Hubo un problema de conexión con el servidor.';

    switch (err.status) {
      case 429:
        title = 'Cuenta Bloqueada';
        message = 'Has excedido el número de intentos permitidos. Tu cuenta ha sido bloqueada temporalmente por 15 minutos.';
        break;
      case 401:
        title = 'Acceso Denegado';
        message = 'El correo o la contraseña son incorrectos. Por favor, verifica tus credenciales.';
        break;
      case 403:
        title = 'Sin Permisos';
        message = 'El usuario no pertenece a esta organización.';
        break;
      case 400:
        title = 'Solicitud Inválida';
        message = err.error?.message || 'Datos de verificación incorrectos.';
        break;
      case 0:
        title = 'Sin Conexión';
        message = 'No se pudo establecer comunicación con la API. Revisa tu conexión a internet.';
        break;
      default:
        message = err.error?.message || message;
    }

    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'Reintentar'
    }).then(() => {
      this.cdr.detectChanges();
    });

    console.error('Error de autenticación:', err);
  }

  /**
   * Helper para alertas de advertencia
   */
  private showWarning(title: string, text: string): void {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: text
    });
  }
}