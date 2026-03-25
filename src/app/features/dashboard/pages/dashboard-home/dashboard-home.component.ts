import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
  standalone: false
})
export class DashboardHomeComponent implements OnInit {

  // Configuración de la Gráfica
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ingresos Mensuales',
      fill: true,
      tension: 0.4,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)'
    }]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  public lineChartLegend = false;

  // Estados
  isLoading = true;
  isExporting = false;

  // Filtros de Fecha
  filterStartDate: string = '';
  filterEndDate: string = '';

  stats = [
    { label: 'Facturas Totales (Periodo)', value: '0', icon: 'description', color: 'var(--primary)' },
    { label: 'Pendientes de Pago', value: '$0.00', icon: 'pending_actions', color: 'var(--accent)' },
    { label: 'Clientes Activos', value: '0', icon: 'group', color: '#10b981' },
    { label: 'Ingresos del Periodo', value: '$0.00', icon: 'payments', color: '#3b82f6' }
  ];

  recentInvoices: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.filterStartDate = firstDay.toISOString().split('T')[0];
    this.filterEndDate = lastDay.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  /**
   * Ejecuta ambas cargas en paralelo y detiene el loading al final
   */
  applyFilters(): void {
    this.isLoading = true;

    forkJoin({
      summary: this.dashboardService.getDashboardSummary(this.filterStartDate, this.filterEndDate),
      trend: this.dashboardService.getRevenueTrend()
    })
    .pipe(
      finalize(() => {
        this.zone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      })
    )
    .subscribe({
      next: (result) => {
        this.processSummary(result.summary);
        this.processTrend(result.trend);
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard', err);
      }
    });
  }

  private processSummary(res: any): void {
    const data = res.data ? res.data : res;
    if (!data || !data.kpis) return;

    const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const numberFormatter = new Intl.NumberFormat('es-MX');

    this.stats[0].value = numberFormatter.format(data.kpis.totalInvoicesMonth || 0);
    this.stats[1].value = currencyFormatter.format(data.kpis.pendingPaymentAmount || 0);
    this.stats[2].value = numberFormatter.format(data.kpis.activeCustomers || 0);
    this.stats[3].value = currencyFormatter.format(data.kpis.monthlyRevenue || 0);

    this.recentInvoices = data.recentInvoices || [];
  }

  private processTrend(res: any): void {
    const data = res.data ? res.data : res;
    if (data && data.labels && data.data) {
      this.lineChartData = {
        labels: data.labels,
        datasets: [{
          data: data.data,
          label: 'Ingresos Mensuales',
          fill: true, tension: 0.4,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)'
        }]
      };
    }
  }

  exportReport(): void {
    if (this.isExporting) return;
    this.isExporting = true;

    this.dashboardService.exportInvoicesMonth(this.filterStartDate, this.filterEndDate)
      .pipe(finalize(() => {
        this.zone.run(() => {
          this.isExporting = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Reporte_Facturacion_${this.filterStartDate}_a_${this.filterEndDate}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        }
      });
  }
}