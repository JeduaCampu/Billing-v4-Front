import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BillingService } from '../../services/billing.service';
import { Invoice, PaginationData } from '../../models/invoice.model';
import Swal from 'sweetalert2';
import  {AuthService} from '../../../../core/services/auth.service';

@Component({
  selector: 'app-billing-list',
  templateUrl: './billing-list.component.html',
  styleUrl: './billing-list.component.scss',
  standalone: false
})
export class BillingListComponent implements OnInit {

  invoices: Invoice[] = [];
  pagination: PaginationData | null = null;

  isLoading: boolean = false;
  searchTerm: string = '';

  currentPage: number = 1;
  limit: number = 10;

  showCreateModal: boolean = false;

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;

    this.billingService.getInvoices(this.currentPage, this.limit).subscribe({
      next: (res) => {
        this.invoices = res.data;
        this.pagination = res.pagination;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudieron cargar las facturas. Por favor, intenta de nuevo.',
          confirmButtonColor: '#1e3a8a'
        });
      }
    });
  }

  get filteredInvoices(): Invoice[] {
    if (!this.searchTerm) return this.invoices;

    const lowerTerm = this.searchTerm.toLowerCase();
    return this.invoices.filter(inv => {
      const clientName = inv.Customer?.legalName || '';
      const folio = inv.folio || '';
      return clientName.toLowerCase().includes(lowerTerm) || folio.toLowerCase().includes(lowerTerm);
    });
  }

  // --- Controles de Paginación ---
  goToNextPage(): void {
    if (this.pagination && this.currentPage < this.pagination.totalPages) {
      this.currentPage++;
      this.loadInvoices();
    }
  }

  goToPrevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadInvoices();
    }
  }

  // --- Acciones de Fila ---

  downloadPdf(invoice: Invoice): void {
    if (!invoice.uuid) {
      Swal.fire({
        icon: 'warning',
        title: 'Factura Incompleta',
        text: `La factura ${invoice.folio} no cuenta con un UUID válido.`,
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }

    // Modal de "Cargando..."
    Swal.fire({
      title: 'Descargando PDF...',
      text: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.billingService.downloadInvoiceFile(invoice.uuid, 'pdf').subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `Factura_${invoice.series || ''}${invoice.folio}.pdf`;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        Swal.close();
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Descarga',
          text: 'No se pudo descargar el documento. Intente nuevamente.',
          confirmButtonColor: '#1e3a8a'
        });
      }
    });
  }

  sendEmail(invoice: Invoice): void {
    if (!invoice.uuid) {
      Swal.fire({
        icon: 'warning',
        title: 'Factura Incompleta',
        text: `La factura ${invoice.folio} no cuenta con un UUID válido.`,
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }

    const emailDestino = invoice.Customer?.email || 'el cliente';

    Swal.fire({
      title: '¿Enviar por correo?',
      text: `Se enviará la factura a: ${emailDestino}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        Swal.fire({
          title: 'Enviando correo...',
          text: 'Conectando con el servidor de correo.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.billingService.sendInvoiceEmail(invoice.uuid).subscribe({
          next: (res) => {
            Swal.fire({
              icon: 'success',
              title: '¡Enviado!',
              text: res.message || `Factura enviada correctamente a ${emailDestino}.`,
              confirmButtonColor: '#1e3a8a'
            });
          },
          error: (err) => {
            console.error('Error al enviar correo:', err);
            Swal.fire({
              icon: 'error',
              title: 'Fallo en el Envío',
              text: 'Ocurrió un problema al enviar el correo. Revisa los logs.',
              confirmButtonColor: '#1e3a8a'
            });
          }
        });
      }
    });
  }

  cancelInvoice(invoice: Invoice): void {
    if (!invoice.uuid) {
      Swal.fire({
        icon: 'warning',
        title: 'Factura Incompleta',
        text: `La factura ${invoice.folio} no cuenta con un UUID válido para cancelar.`,
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }

    Swal.fire({
      title: 'Cancelar Factura',
      html: `
        <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem;">
          ¿Estás seguro de cancelar la factura <strong>${invoice.series || ''}${invoice.folio}</strong>?
        </p>
        <div style="text-align: left;">
          <label style="font-size: 0.8rem; font-weight: 600;">Motivo de Cancelación (SAT)</label>
          <select id="cancel-motive" class="swal2-select" style="width: 100%; margin: 0.5rem 0 1rem;">
            <option value="01">01 - Comprobantes emitidos con errores con relación</option>
            <option value="02" selected>02 - Comprobantes emitidos con errores sin relación</option>
            <option value="03">03 - No se llevó a cabo la operación</option>
            <option value="04">04 - Operación nominativa relacionada en una factura global</option>
          </select>
          
          <div id="substitution-container" style="display: none;">
            <label style="font-size: 0.8rem; font-weight: 600;">UUID de Sustitución</label>
            <input id="substitution-uuid" class="swal2-input" style="width: 100%; margin: 0.5rem 0;" placeholder="Ej: 123e4567-e89b-12d3...">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, Cancelar',
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        const motiveSelect = document.getElementById('cancel-motive') as HTMLSelectElement;
        const subContainer = document.getElementById('substitution-container') as HTMLDivElement;

        motiveSelect.addEventListener('change', (e: any) => {
          if (e.target.value === '01') {
            subContainer.style.display = 'block';
          } else {
            subContainer.style.display = 'none';
          }
        });
      },
      preConfirm: () => {
        const motive = (document.getElementById('cancel-motive') as HTMLSelectElement).value;
        const substitutionUuid = (document.getElementById('substitution-uuid') as HTMLInputElement).value;

        if (motive === '01' && !substitutionUuid) {
          Swal.showValidationMessage('Debes ingresar el UUID de sustitución para el motivo 01.');
          return false;
        }

        return { motive, substitutionUuid };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {

        Swal.fire({
          title: 'Procesando cancelación...',
          text: 'Conectando con el PAC/SAT.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        this.billingService.cancelInvoice(invoice.uuid, result.value.motive, result.value.substitutionUuid).subscribe({
          next: (res) => {
            Swal.fire({
              icon: 'success',
              title: 'Factura Cancelada',
              text: 'La cancelación fue aceptada exitosamente.',
              confirmButtonColor: '#1e3a8a'
            }).then(() => {
              this.loadInvoices();
            });
          },
          error: (err) => {
            console.error('Error al cancelar factura:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error de Cancelación',
              text: err.error?.message || 'Ocurrió un problema al intentar cancelar la factura.',
              confirmButtonColor: '#1e3a8a'
            });
          }
        });
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(reload: boolean): void {
    this.showCreateModal = false;
    if (reload) {
      this.currentPage = 1;
      this.loadInvoices();
    }
  }
}