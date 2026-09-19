import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html' 
})
export class DashboardComponent implements OnInit {
  resumen = { total_prendas: 0, total_sucursales: 0, total_proveedores: 0, total_categorias: 0, stock_total: 0 };
  cargando = true;

  // Variables del Gráfico
  public chartOptions: ChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  public chartLabels: string[] = ['Prendas (Modelos)', 'Proveedores', 'Categorías', 'Sucursales'];
  public chartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.chartLabels,
    datasets: [{ data: [0, 0, 0, 0], label: 'Cantidades', backgroundColor: ['#111827', '#374151', '#6B7280', '#9CA3AF'], borderRadius: 4 }]
  };

  // Variables de la IA
  escuchando = false;
  procesandoIA = false;
  reporteIA: SafeHtml | null = null;
  comandoReconocido = '';

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer // Inyectamos la herramienta para limpiar el HTML de la IA
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
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/dashboard/resumen').subscribe({
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

  iniciarReconocimientoVoz() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.escuchando = true;
      this.comandoReconocido = '';
      this.cdr.detectChanges();
    };

    recognition.onresult = (event: any) => {
      this.escuchando = false;
      this.comandoReconocido = event.results[0][0].transcript;
      this.cdr.detectChanges();
      
      this.generarReporteIA(this.comandoReconocido);
    };

    recognition.onerror = (event: any) => {
      this.escuchando = false;
      this.cdr.detectChanges();
      alert("Error con el micrófono. Asegúrate de dar los permisos en el navegador.");
    };

    recognition.start();
  }

  generarReporteIA(textoVoz: string) {
    this.procesandoIA = true;
    this.reporteIA = null;
    this.cdr.detectChanges();

    this.http.post('https://fashionstore-api-kedu.onrender.com/api/ia/generar-reporte', { texto_voz: textoVoz }).subscribe({
      next: (res: any) => {
        // Convertimos el Markdown de Gemini a HTML para que se vea estético
        let textoFormateado = res.reporte
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');

        this.reporteIA = this.sanitizer.bypassSecurityTrustHtml(textoFormateado);
        this.procesandoIA = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error de IA:", err);
        this.procesandoIA = false;
        alert("Error al procesar el reporte con Gemini.");
        this.cdr.detectChanges();
      }
    });
  }
  cargarVentas() {
  this.http.get<any[]>('https://fashionstore-api-kedu.onrender.com/api/catalogo/ordenes/historial').subscribe({
    next: (data) => {
      this.ventas = data;
      this.cdr.detectChanges();
    },
    error: (err) => console.error("Error al cargar ventas:", err)
  });
}
}