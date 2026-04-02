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
  customers: any[] = [];

  // --- CATÁLOGOS DEL SAT ---
  readonly regimenesSAT = {
    moral: [
      { key: '601', desc: 'General de Ley Personas Morales' },
      { key: '603', desc: 'Personas Morales con Fines no Lucrativos' },
      { key: '626', desc: 'Régimen Simplificado de Confianza (RESICO)' }
    ],
    fisica: [
      { key: '605', desc: 'Sueldos y Salarios e Ingresos Asimilados' },
      { key: '606', desc: 'Arrendamiento' },
      { key: '612', desc: 'Personas Físicas con Actividades Empresariales y Profesionales' },
      { key: '626', desc: 'Régimen Simplificado de Confianza (RESICO)' }
    ]
  };

  readonly usosCfdiSAT = {
    moral: [
      { key: 'G01', desc: 'Adquisición de mercancías' },
      { key: 'G03', desc: 'Gastos en general' },
      { key: 'I04', desc: 'Equipo de cómputo y accesorios' },
      { key: 'I08', desc: 'Otra maquinaria y equipo' }
    ],
    fisica: [
      { key: 'G01', desc: 'Adquisición de mercancías' },
      { key: 'G03', desc: 'Gastos en general' },
      { key: 'I04', desc: 'Equipo de cómputo y accesorios' },
      { key: 'D01', desc: 'Honorarios médicos, dentales y gastos hospitalarios' },
      { key: 'D02', desc: 'Gastos médicos por incapacidad o discapacidad' },
      { key: 'CP01', desc: 'Pagos' }
    ]
  };

  // --- GETTERS DINÁMICOS ---
  
  get rfcType(): 'fisica' | 'moral' | null {
    if (!this.invoiceForm) return null;
    const rfc = this.invoiceForm.get('customer.rfc')?.value || '';
    if (rfc.length === 12) return 'moral';
    if (rfc.length === 13) return 'fisica';
    return null;
  }

  get availableRegimenes() {
    const type = this.rfcType;
    if (type === 'moral') return this.regimenesSAT.moral;
    if (type === 'fisica') return this.regimenesSAT.fisica;
    return [];
  }

  get availableUsos() {
    const type = this.rfcType;
    if (type === 'moral') return this.usosCfdiSAT.moral;
    if (type === 'fisica') return this.usosCfdiSAT.fisica;
    return [];
  }

  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
    this.invoiceForm.valueChanges.subscribe(() => {
      if (this.isDraftReviewed) {
        this.isDraftReviewed = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCustomers(): void {
    this.billingService.getCustomers().subscribe({
      next: (res) => {
        this.customers = res.data || res;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  onCustomerSelect(event: any): void {
  const customerId = event.target.value;
  const customerGroup = this.invoiceForm.get('customer');

  if (customerId === 'NEW' || !customerId) {
    customerGroup?.reset({
      taxRegime: '603',
      cfdiUse: 'G03',
      address: { country: 'MEX' }
    });

    customerGroup?.get('taxRegime')?.disable();
    customerGroup?.get('cfdiUse')?.disable();

  } else {
    const selected = this.customers.find(c => c.id === customerId);
    
    if (selected) {
      const address = selected.address || {};

      customerGroup?.patchValue({
        name: selected.legalName,
        rfc: selected.taxId,
        taxRegime: selected.taxSystem || '603',
        email: selected.email,
        cfdiUse: 'G03', 
        address: {
          street: address.street || '',
          exterior: address.exterior || '',
          interior: address.interior || '',
          neighborhood: address.neighborhood || '',
          zip: address.zip || selected.zipCode || '',
          city: address.city || '',
          municipality: address.municipality || '',
          state: address.state || '',
          country: address.country || 'MEX'
        }
      });

      customerGroup?.get('taxRegime')?.enable();
      customerGroup?.get('cfdiUse')?.enable();
    }
  }

  this.cdr.detectChanges();
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
        text: 'Por favor, completa todos los campos requeridos para generar la vista previa.'
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
        const fileURL = window.URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
        setTimeout(() => {
          Swal.fire({
            icon: 'info',
            title: 'Borrador Generado',
            text: 'Se ha abierto una vista previa en una nueva pestaña. Por favor, revisa que los importes y datos sean correctos antes de timbrar la factura ante el SAT.',
            showCancelButton: true,
            confirmButtonText: 'Todo correcto, habilitar emisión',
            cancelButtonText: 'Necesito modificar datos',
            reverseButtons: true
          }).then((result) => {
            if (result.isConfirmed) {
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
              this.isDraftReviewed = false;
              this.cdr.detectChanges();
            }
          });
        }, 300);
      },
      error: (err) => {
        console.error('Error al generar borrador:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar la vista previa. Revisa la consola o intenta nuevamente.'
        });
      }
    });
  }

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
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
    if (!this.isDraftReviewed) {
      Swal.fire('Atención', 'Debes generar y confirmar la vista previa antes de emitir la factura.', 'warning');
      return;
    }

    if (this.invoiceForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, completa todos los campos requeridos correctamente.'
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
          text: 'La factura se procesó correctamente.'
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
          text: err.error?.message || 'No se pudo crear la factura.'
        });
      }
    });
  }
}