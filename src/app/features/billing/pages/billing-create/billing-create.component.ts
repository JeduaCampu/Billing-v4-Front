import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-billing-create',
  templateUrl: './billing-create.component.html',
  styleUrls: ['./billing-create.component.scss'],
  standalone: false
})
export class BillingCreateComponent implements OnInit {
  @Output() closeModal = new EventEmitter<boolean>();

  invoiceForm!: FormGroup;
  isLoading = false;
  isDraftReviewed = false;

  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private cdr: ChangeDetectorRef // 1. Inyectamos ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();

    // 2. Ajustamos la detección de cambios
    this.invoiceForm.valueChanges.subscribe(() => {
      // Solo lo bloqueamos si ya estaba habilitado
      if (this.isDraftReviewed) {
        this.isDraftReviewed = false;
        this.cdr.detectChanges(); // Forzamos actualización visual del botón
      }
    });
  }

  initForm(): void {
    this.invoiceForm = this.fb.group({
      currency: ['MXN', Validators.required],
      paymentForm: ['03', Validators.required],
      paymentMethod: ['PUE', Validators.required],
      cfdiType: ['I', Validators.required],
      series: ['V4', Validators.required],
      folio: [''],
      recurrence: [null, [Validators.min(2)]],
      notes: [''],
      originPlatform: ['BILLING'],

      customer: this.fb.group({
        name: ['', Validators.required],
        rfc: ['', [Validators.required, Validators.minLength(12)]],
        taxRegime: ['603', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        cfdiUse: ['G03', Validators.required],

        address: this.fb.group({
          street: [''],
          exterior: [''],
          interior: [''],
          neighborhood: [''],
          zip: ['', Validators.required],
          city: [''],
          municipality: [''],
          state: [''],
          country: ['MEX']
        })
      }),

      items: this.fb.array([])
    });

    this.addItem();
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  onPreview(): void {
    if (this.invoiceForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, completa todos los campos requeridos para generar la vista previa.',
        confirmButtonColor: '#1e3a8a'
      });
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.invoiceForm.value };

    if (!payload.recurrence || payload.recurrence <= 1) {
      delete payload.recurrence;
    }

    Swal.fire({
      title: 'Generando borrador...',
      text: 'Calculando totales e impuestos...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.billingService.createDraft(payload).subscribe({
      next: (blob: Blob) => {
        Swal.close();

        // 3. Abrimos el PDF primero
        const fileURL = window.URL.createObjectURL(blob);
        window.open(fileURL, '_blank');

        // 4. Pequeño delay para asegurar que el navegador abre la pestaña 
        // antes de mostrar el SweetAlert
        setTimeout(() => {
          Swal.fire({
            icon: 'info',
            title: 'Borrador Generado',
            text: 'Se ha abierto una vista previa en una nueva pestaña. Por favor, revisa que los importes y datos sean correctos antes de timbrar la factura ante el SAT.',
            showCancelButton: true,
            confirmButtonText: 'Todo correcto, habilitar emisión',
            cancelButtonText: 'Necesito modificar datos',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
            reverseButtons: true
          }).then((result) => {
            if (result.isConfirmed) {
              // 5. IMPORTANTE: Habilitamos y forzamos la actualización visual
              this.isDraftReviewed = true;
              this.cdr.detectChanges();

              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Botón de emisión habilitado.',
                showConfirmButton: false,
                timer: 3000
              });
            } else {
              // Si eligen "Modificar", nos aseguramos de que siga bloqueado
              this.isDraftReviewed = false;
              this.cdr.detectChanges();
            }
          });
        }, 300); // 300ms de delay
      },
      error: (err) => {
        console.error('Error al generar borrador:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar la vista previa. Revisa la consola o intenta nuevamente.',
          confirmButtonColor: '#1e3a8a'
        });
      }
    });
  }

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      unitCode: ['E48', Validators.required],
      productKey: ['81112100', Validators.required],
      discount: [0],
      iva: [0.16],
      isr: [0]
    });
  }

  addItem(): void {
    this.items.push(this.createItemFormGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onCancel(): void {
    this.closeModal.emit(false);
  }

  onSubmit(): void {
    // 6. Corregida la lógica de validación aquí
    if (!this.isDraftReviewed) {
      Swal.fire('Atención', 'Debes generar y confirmar la vista previa antes de emitir la factura.', 'warning');
      return;
    }

    if (this.invoiceForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, completa todos los campos requeridos correctamente.',
        confirmButtonColor: '#1e3a8a'
      });
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload = { ...this.invoiceForm.value };
    if (!payload.recurrence || payload.recurrence <= 1) {
      delete payload.recurrence;
    }

    Swal.fire({
      title: 'Creando factura...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.billingService.createInvoice(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Factura Creada',
          text: 'La factura se procesó correctamente.',
          confirmButtonColor: '#1e3a8a'
        }).then(() => {
          this.closeModal.emit(true);
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al crear factura:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudo crear la factura.',
          confirmButtonColor: '#1e3a8a'
        });
      }
    });
  }
}