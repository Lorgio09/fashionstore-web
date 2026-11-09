import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterLink],
  templateUrl: './dashboard.html' 
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  resumen = { total_prendas: 0, total_sucursales: 0, total_proveedores: 0, total_categorias: 0, stock_total: 0 };
  cargando = true;

  // Variables del Gráfico
  public chartOptions: ChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  public chartLabels: string[] = ['Prendas (Modelos)', 'Proveedores', 'Categorías', 'Sucursales'];
  public chartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.chartLabels,
    datasets: [{ data: [0, 0, 0, 0], label: 'Cantidades', backgroundColor: ['#111827', '#374151', '#6B7280', '#9CA3AF'], borderRadius: 4 }]
  };

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ventas: any[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarResumen();
      this.cargarVentas();
    } else {
      this.cargando = false;
    }
  }

  cargarResumen() {
    this.http.get(`${environment.apiUrl}/catalogo/dashboard/resumen`).subscribe({
      next: (data: any) => {
        this.resumen = data;
        this.chartData = {
          labels: this.chartLabels,
          datasets: [{ 
            data: [data.total_prendas, data.total_proveedores, data.total_categorias, data.total_sucursales], 
            label: 'Total Registrado', backgroundColor: ['#111827', '#374151', '#6B7280', '#9CA3AF'], borderRadius: 4
          }]
        };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar el dashboard", err);
        this.cargando = false;
      }
    });
  }

  cargarVentas() {
  this.http.get<any[]>(`${environment.apiUrl}/catalogo/ordenes/historial`).subscribe({
    next: (data) => {
      this.ventas = data;
      this.cdr.detectChanges();
    },
    error: (err) => console.error("Error al cargar ventas:", err)
  });
}
}