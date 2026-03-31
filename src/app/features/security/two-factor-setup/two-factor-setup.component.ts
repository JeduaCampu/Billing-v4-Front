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
  isLoading: boolean = false;
  isEnabling: boolean = false;
  isLoadingStatus: boolean = true;

  twoFactorEnabled: boolean = false;
  isDisabling: boolean = false;
  private userSub!: Subscription;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.user$.subscribe(user => {
      this.twoFactorEnabled = user?.two_factor_enabled || false;
      this.cdr.detectChanges();
    });
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

  onDisable2FA(): void {
  Swal.fire({
    title: '¿Estás seguro?',
    text: "Tu cuenta será menos segura sin el Segundo Factor.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, desactivar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.isDisabling = true;
      this.cdr.detectChanges();

      this.authService.disable2fa().subscribe({
        next: () => {
          this.twoFactorEnabled = false;
          this.qrCodeUrl = '';
          this.verificationToken = '';
          this.isDisabling = false;

          this.authService.updateUserStatus(false);
          this.cdr.detectChanges();

          Swal.fire({
            icon: 'success',
            title: 'Desactivado',
            text: 'El 2FA ha sido removido de tu cuenta.',
            confirmButtonColor: '#1e3a8a'
          });
        },
        error: (err) => {
          this.isDisabling = false;
          this.cdr.detectChanges();
          Swal.fire('Error', 'No se pudo desactivar el 2FA.', 'error');
        }
      });
    }
  });
}
}