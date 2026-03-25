import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const hasPermission = allowedRoles.some(role => authService.hasRole(role));

    if (hasPermission) {
      return true;
    }
    console.warn('Acceso denegado: Usuario no es Admin');
    return router.parseUrl('/access-denied'); 
  };
};