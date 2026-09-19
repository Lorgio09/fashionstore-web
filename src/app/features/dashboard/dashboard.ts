import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html' 
})
export class DashboardComponent implements OnInit {
  resumen = {
    total_prendas: 0,
    total_sucursales: 0,
    total_proveedores: 0,
    total_categorias: 0,
    stock_total: 0
  };
  cargando = true;

  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false } // Ocultamos la leyenda para que sea más limpio
    }
  };
  public chartLabels: string[] = ['Prendas (Modelos)', 'Proveedores', 'Categorías', 'Sucursales'];
  public chartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.chartLabels,
    datasets: [
      { 
        data: [0, 0, 0, 0], 
        label: 'Cantidades',
        backgroundColor: ['#111827', '#374151', '#6B7280', '#9CA3AF'],
        borderRadius: 4
      }
    ]
  };

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object // ¡NUEVO! Identificador de plataforma
  ) {}

  ngOnInit() {
    // ¡NUEVO! Solo hacemos la petición si estamos en el navegador web
    if (isPlatformBrowser(this.platformId)) {
      this.cargarResumen();
    } else {
      // Si estamos en el servidor de Angular (SSR), simplemente dejamos de cargar
      this.cargando = false;
    }
  }

  cargarResumen() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/dashboard/resumen').subscribe({
      next: (data: any) => {
        this.resumen = data;
        
        // ACTUALIZAMOS EL GRÁFICO CON DATOS REALES
        this.chartData = {
          labels: this.chartLabels,
          datasets: [{ 
            data: [data.total_prendas, data.total_proveedores, data.total_categorias, data.total_sucursales], 
            label: 'Total Registrado',
            backgroundColor: ['#111827', '#374151', '#6B7280', '#9CA3AF'],
            borderRadius: 4
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
}