import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
  standalone: false
})
export class DashboardHomeComponent implements OnInit {
  
  stats = [
    { label: 'Facturas Totales', value: '1,250', icon: 'description', color: 'var(--primary)' },
    { label: 'Pendientes de Pago', value: '45', icon: 'pending_actions', color: 'var(--accent)' },
    { label: 'Clientes Activos', value: '82', icon: 'group', color: '#10b981' },
    { label: 'Ingresos Mensuales', value: '$45,200.00', icon: 'payments', color: '#3b82f6' }
  ];

  recentInvoices = [
    { id: 'INV-001', client: 'Empresa A', amount: 1500.00, status: 'Pagada' },
    { id: 'INV-002', client: 'Empresa B', amount: 2300.50, status: 'Pendiente' },
    { id: 'INV-003', client: 'Empresa C', amount: 850.00, status: 'Cancelada' }
  ];

  constructor() { }

  ngOnInit(): void {
    console.log('Dashboard cargado');
  }
}