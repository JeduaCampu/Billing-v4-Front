import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-two-factor-setup',
  templateUrl: './two-factor-setup.component.html',
  styleUrl: './two-factor-setup.component.scss',
  standalone: false
})
export class TwoFactorSetupComponent implements OnInit, OnDestroy {
  // Estados de la UI
  qrCodeUrl: string = '';
  verificationToken: string = '';
  
  // Spinners de carga
  isLoading: boolean = false;       // Generación de QR
  isEnabling: boolean = false;      // Proceso de activación
  isLoadingStatus: boolean = true;  // Verificación inicial al cargar componente

  twoFactorEnabled: boolean = false;
  private userSub!: Subscription;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 1. Suscripción al estado local del usuario
    this.userSub = this.authService.user$.subscribe(user => {
      this.twoFactorEnabled = user?.two_factor_enabled || false;
      this.cdr.detectChanges();
    });

    // 2. Verificación de "Verdad Única" contra el Backend
    this.checkCurrent2FAStatus();
  }

  /**
   * Consulta al servidor si el 2FA está activo realmente
   */
  private checkCurrent2FAStatus(): void {
    this.isLoadingStatus = true;
    this.authService.get2faStatus().subscribe({
      next: (res) => {
        this.twoFactorEnabled = res.enabled;
        
        // Sincronizamos el servicio por si el localStorage estaba desfasado
        if (this.authService.updateUserStatus) {
          this.authService.updateUserStatus(res.enabled);
        }
        
        this.isLoadingStatus = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al verificar estado 2FA:", err);
        this.isLoadingStatus = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Inicia el flujo de configuración obteniendo el secreto y el QR
   */
  onStartSetup(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.get2faSetup().subscribe({
      next: (res) => {
        this.qrCodeUrl = res.qrCodeUrl;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el código QR. Inténtalo de nuevo.',
          confirmButtonColor: '#1e3a8a'
        });
      }
    });
  }

  /**
   * Valida el token de 6 dígitos y activa el 2FA definitivamente
   */
  onConfirmActivation(): void {
    if (this.verificationToken.length !== 6) return;

    this.isEnabling = true;
    this.cdr.detectChanges();

    this.authService.enable2fa(this.verificationToken).subscribe({
      next: () => {
        this.isEnabling = false;
        this.twoFactorEnabled = true;
        this.qrCodeUrl = '';
        this.verificationToken = '';

        // Actualizamos el estado global del usuario en el AuthService
        if (this.authService.updateUserStatus) {
          this.authService.updateUserStatus(true);
        }

        this.cdr.detectChanges();

        Swal.fire({
          icon: 'success',
          title: '2FA Activado',
          text: 'Tu cuenta ahora está protegida correctamente.',
          confirmButtonColor: '#1e3a8a'
        });
      },
      error: (err) => {
        this.isEnabling = false;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Código Incorrecto',
          text: err.error?.message || 'El token introducido no es válido.',
          confirmButtonColor: '#1e3a8a'
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}