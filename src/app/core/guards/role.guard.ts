import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Utilizamos el helper que ya creaste en tu AuthService
    const hasPermission = allowedRoles.some(role => authService.hasRole(role));

    if (hasPermission) {
      return true;
    }

    // Si no tiene permiso, alertamos y lo mandamos a una ruta segura (ej. dashboard)
    alert('No tienes permisos para ver esta sección');
    return router.parseUrl('/dashboard'); 
  };
};