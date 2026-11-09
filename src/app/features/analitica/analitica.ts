import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType, Plugin } from 'chart.js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth';
import { ROLES } from '../../core/models/sesion';
import { NotificacionService } from '../../core/services/notificacion.service';
import { AnaliticaService } from '../../core/services/analitica.service';
import { ReportesIaService } from '../../core/services/reportes-ia.service';
import { DashboardML, Indicador, IndicadoresML, ModeloML } from '../../core/models/analitica';
import { fechaCorta, numero } from '../../shared/utils/formato';
import { fechaHora } from '../../shared/utils/fechas';
import { IconoComponent } from '../../shared/components/icono/icono';

interface GraficoListo {
  type: ChartType;
  data: any;
  options: any;
  plugins?: Plugin[];
}

interface Kpi {
  clave: keyof IndicadoresML;
  titulo: string;
  decimales: number;
  prefijo: string;
}

/** Paleta de respaldo solo si /ia/reportes/tipos no respondiera (es la misma del backend). */
const PALETA_RESPALDO = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

@Component({
  selector: 'app-analitica',
  standalone: true,
  imports: [IconoComponent, CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './analitica.html',
})
export class AnaliticaComponent implements OnInit {
  private servicio = inject(AnaliticaService);
  private reportes = inject(ReportesIaService);
  private http = inject(HttpClient);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly pestana = signal<'resumen' | 'modelos'>('resumen');
  readonly datos = signal<DashboardML | null>(null);
  readonly cargando = signal(false);
  readonly entrenando = signal(false);
  readonly paleta = signal<string[]>(PALETA_RESPALDO);

  readonly esAdmin = computed(() => this.auth.tieneRol(ROLES.ADMIN));
  sucursales: { id: number; nombre: string }[] = [];
  sucursalId: number | null = null;

  readonly fechaCorta = fechaCorta;
  readonly fechaHora = fechaHora;
  readonly numero = numero;

  readonly kpis: Kpi[] = [
    { clave: 'ventas_mes', titulo: 'Ventas del mes', decimales: 2, prefijo: 'Bs ' },
    { clave: 'cantidad_ventas_mes', titulo: 'Cantidad de ventas', decimales: 0, prefijo: '' },
    { clave: 'ticket_promedio', titulo: 'Ticket promedio', decimales: 2, prefijo: 'Bs ' },
    { clave: 'unidades_mes', titulo: 'Unidades vendidas', decimales: 0, prefijo: '' },
    { clave: 'clientes_activos_30_dias', titulo: 'Clientes activos (30 días)', decimales: 0, prefijo: '' },
  ];

  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.reportes.tipos().subscribe({ next: (c) => c.paleta?.length && this.paleta.set(c.paleta), error: () => {} });
    if (this.esAdmin()) {
      this.http.get<any[]>(`${environment.apiUrl}/catalogo/sucursales`).subscribe({
        next: (l) => (this.sucursales = (l ?? []).map((s) => ({ id: s.id, nombre: s.nombre }))),
      });
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicio.dashboard(this.sucursalId).subscribe({
      next: (d) => { this.datos.set(d); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.notif.errorHttp(e, 'No se pudo cargar la analítica.'); },
    });
  }

  reentrenar(): void {
    if (this.entrenando()) return;
    this.entrenando.set(true);
    this.servicio.entrenar().subscribe({
      next: (m) => {
        this.entrenando.set(false);
        const errores = [m.demanda?.error && `Demanda: ${m.demanda.error}`, m.segmentacion?.error && `Segmentación: ${m.segmentacion.error}`]
          .filter(Boolean) as string[];
        if (errores.length) this.notif.aviso(errores.join(' · '), 'Entrenamiento incompleto');
        else this.notif.exito(
          `Demanda v${m.demanda?.version} y segmentación v${m.segmentacion?.version} entrenadas con los datos de la empresa.`,
          'Modelos reentrenados');
        this.cargar();
      },
      error: (e) => { this.entrenando.set(false); this.notif.errorHttp(e, 'No se pudo reentrenar los modelos.'); },
    });
  }

  // ---------- Indicadores ----------

  indicador(clave: keyof IndicadoresML): Indicador | undefined {
    return this.datos()?.indicadores?.[clave];
  }

  variacion(i: Indicador | undefined): { texto: string; sube: boolean | null } {
    const v = i?.variacion_pct;
    if (v === null || v === undefined) return { texto: 'Sin dato anterior', sube: null };
    if (v === 0) return { texto: '0,0 %', sube: null };
    return { texto: `${v > 0 ? '+' : ''}${numero(v, 1)} %`, sube: v > 0 };
  }

  // ---------- Gráfico real + predicción ----------

  readonly graficoSerie = computed<GraficoListo | null>(() => {
    const d = this.datos();
    if (!d?.serie?.length) return null;
    const [cReal, cPred] = this.paleta();
    const etiquetas = d.serie.map((p) => fechaCorta(p.fecha).slice(0, 5));
    const iHoy = d.serie.findIndex((p) => p.fecha >= d.generado_en && p.prediccion !== null);
    const banda = conAlfa(cPred, 0.18);

    // Marca vertical de "hoy" (inicio de la predicción).
    const marcaHoy: Plugin = {
      id: 'marcaHoy',
      afterDatasetsDraw: (chart) => {
        if (iHoy < 0) return;
        const x = chart.scales['x'].getPixelForValue(iHoy);
        const { top, bottom } = chart.chartArea;
        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = '#6b7280';
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#374151';
        ctx.font = '600 11px sans-serif';
        ctx.fillText('Hoy', x + 4, top + 12);
        ctx.restore();
      },
    };

    return {
      type: 'line',
      plugins: [marcaHoy],
      data: {
        labels: etiquetas,
        datasets: [
          { label: 'Ventas reales', data: d.serie.map((p) => p.real), borderColor: cReal, backgroundColor: cReal,
            borderWidth: 2, pointRadius: 0, tension: 0.2, spanGaps: false },
          { label: 'Predicción', data: d.serie.map((p) => p.prediccion), borderColor: cPred, backgroundColor: cPred,
            borderWidth: 2, borderDash: [6, 4], pointRadius: 2, tension: 0.2, spanGaps: false },
          // Banda: del máximo (sin relleno) al mínimo (rellena hacia el anterior).
          { label: 'máximo', data: d.serie.map((p) => p.maximo), borderWidth: 0, pointRadius: 0, fill: false,
            borderColor: 'transparent', backgroundColor: banda },
          { label: 'Rango probable (80 %)', data: d.serie.map((p) => p.minimo), borderWidth: 0, pointRadius: 0,
            fill: '-1', borderColor: 'transparent', backgroundColor: banda },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top', labels: { boxWidth: 12, filter: (l: any) => l.text !== 'máximo' } },
          tooltip: {
            filter: (c: any) => c.raw !== null && c.dataset.label !== 'máximo' && c.dataset.label !== 'Rango probable (80 %)',
            callbacks: {
              title: (items: any[]) => fechaCorta(d.serie[items[0].dataIndex].fecha),
              label: (c: any) => `${c.dataset.label}: ${numero(c.raw, 1)} unid.`,
              afterBody: (items: any[]) => {
                const p = d.serie[items[0].dataIndex];
                return p.minimo !== null ? `Rango probable: ${numero(p.minimo, 0)} a ${numero(p.maximo, 0)} unid.` : '';
              },
            },
          },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Unidades por día' }, ticks: { callback: (v: any) => numero(v, 0) } },
          x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
        },
      },
    };
  });

  // ---------- Segmentos ----------

  readonly graficoSegmentos = computed<GraficoListo | null>(() => {
    const s = this.datos()?.segmentos;
    if (!s?.length) return null;
    const paleta = this.paleta();
    return {
      type: 'pie',
      data: {
        labels: s.map((x) => x.segmento),
        datasets: [{ data: s.map((x) => x.clientes), backgroundColor: s.map((_, i) => paleta[i % paleta.length]),
          borderColor: '#ffffff', borderWidth: 2 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 12 } },
          tooltip: { callbacks: { label: (c: any) => `${c.label}: ${c.raw} clientes (${numero(s[c.dataIndex].porcentaje, 1)} %)` } },
        },
      },
    };
  });

  colorSegmento(i: number): string {
    const p = this.paleta();
    return p[i % p.length];
  }

  esCritico(alerta: string): boolean {
    return alerta.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().startsWith('CRIT');
  }

  // ---------- Modelos ----------

  readonly demanda = computed<ModeloML | null>(() => this.datos()?.modelos?.demanda ?? null);
  readonly segmentacion = computed<ModeloML | null>(() => this.datos()?.modelos?.segmentacion ?? null);

  readonly graficoImportancias = computed<GraficoListo | null>(() => {
    const imp: { variable: string; importancia: number }[] = this.demanda()?.metricas?.['importancias'] ?? [];
    if (!imp.length) return null;
    const color = this.paleta()[0];
    return {
      type: 'bar',
      data: {
        labels: imp.map((x) => x.variable),
        datasets: [{ label: 'Importancia', data: imp.map((x) => x.importancia * 100), backgroundColor: color, borderRadius: 3 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => `${numero(c.raw, 1)} % de la importancia` } } },
        scales: { x: { beginAtZero: true, ticks: { callback: (v: any) => `${numero(v, 0)} %` } } },
      },
    };
  });

  readonly graficoSilueta = computed<GraficoListo | null>(() => {
    const m = this.segmentacion()?.metricas;
    const curva: { k: number; silueta: number; inercia: number }[] = m?.['curva'] ?? [];
    if (!curva.length) return null;
    const [c0, c1] = this.paleta();
    const kElegido = m?.['k'];
    return {
      type: 'line',
      data: {
        labels: curva.map((c) => `k = ${c.k}`),
        datasets: [
          { label: 'Coeficiente de silueta', data: curva.map((c) => c.silueta), borderColor: c0, backgroundColor: c0, yAxisID: 'y',
            borderWidth: 2, pointRadius: curva.map((c) => (c.k === kElegido ? 7 : 3)), tension: 0 },
          { label: 'Inercia', data: curva.map((c) => c.inercia), borderColor: c1, backgroundColor: c1, yAxisID: 'y1',
            borderWidth: 2, borderDash: [5, 4], pointRadius: 3, tension: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top', labels: { boxWidth: 12 } },
          tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${numero(c.raw, c.datasetIndex === 0 ? 3 : 1)}` } },
        },
        scales: {
          y: { position: 'left', title: { display: true, text: 'Silueta (mayor es mejor)' }, ticks: { callback: (v: any) => numero(v, 2) } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Inercia' } },
        },
      },
    };
  });

  /** Tiempo transcurrido desde el entrenamiento, en días. */
  diasDesde(iso: string | undefined): number | null {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  }
}

function conAlfa(hex: string, alfa: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? '');
  if (!m) return `rgba(0,0,0,${alfa})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alfa})`;
}
