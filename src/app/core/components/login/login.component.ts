import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  onLogin(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('Login exitoso:', res.user.name);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error en login:', err);
        if (err.status === 401) {
          this.errorMessage = 'Correo o contraseña incorrectos.';
        } else {
          this.errorMessage = 'Hubo un problema de conexión con el servidor.';
        }
      }
    });
  }
}