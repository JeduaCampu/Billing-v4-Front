import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el token existe en localStorage, lo dejamos pasar
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si no, lo mandamos al login
  console.warn('Acceso denegado: Redirigiendo al login');
  router.navigate(['/login']);
  return false;
};