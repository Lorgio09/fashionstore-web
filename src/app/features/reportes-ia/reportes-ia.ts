import { Component, DestroyRef, OnInit, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth';
import { ROLES } from '../../core/models/sesion';
import { NotificacionService } from '../../core/services/notificacion.service';
import { ReportesIaService } from '../../core/services/reportes-ia.service';
import { ReconocimientoVozService } from '../../core/services/reconocimiento-voz.service';
import {
  CatalogoReportes, ColumnaReporte, FiltroReporte, FormatoExportacion, IntencionReporte, ReporteGenerado,
  RespuestaReporteIA, TipoGrafico, TipoReporte, TipoReporteInfo,
} from '../../core/models/reportes';
import { numero } from '../../shared/utils/formato';

interface Opcion { id: number; nombre: string; }

/** Nivel de alerta de reposición (columna `alerta` de la predicción). */
type NivelAlerta = 'critico' | 'atencion' | 'ok' | 'ninguna';

/** Configuración ya armada para <canvas baseChart> (pie, bar o line). */
interface GraficoListo {
  config: { type: ChartType; data: any; options: any };
  alto: number;
  /** En torta con varias series se grafica solo la primera. */
  soloPrimera: string | null;
}

/** Reportes con barras horizontales (etiquetas largas: ranking y stock). */
const HORIZONTALES: TipoReporte[] = ['productos_mas_vendidos', 'stock_bajo', 'prediccion_demanda'];

@Component({
  selector: 'app-reportes-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './reportes-ia.html',
})
export class ReportesIaComponent implements OnInit {
  private servicio = inject(ReportesIaService);
  private http = inject(HttpClient);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  voz = inject(ReconocimientoVozService);

  readonly catalogo = signal<CatalogoReportes | null>(null);
  texto = '';
  readonly generando = signal(false);
  readonly segundos = signal(0);
  readonly ejecutando = signal(false);
  readonly exportando = signal<FormatoExportacion | null>(null);

  /** Última respuesta de la IA (estado, intérprete, mensaje, sugerencias). */
  readonly respuesta = signal<RespuestaReporteIA | null>(null);
  readonly reporte = signal<ReporteGenerado | null>(null);
  /** Intención aplicada al reporte mostrado (la que se exporta). */
  readonly intencion = signal<IntencionReporte | null>(null);
  readonly narrativa = signal<string | null>(null);
  /** true si el reporte se volvió a ejecutar con filtros editados (sin IA). */
  readonly filtrosEditados = signal(false);
  readonly tipoGrafico = signal<TipoGrafico>('barras');

  /** Copia editable de la intención. */
  filtros: IntencionReporte | null = null;
  readonly mostrarFiltros = signal(false);
  sucursales: Opcion[] = [];
  categorias: Opcion[] = [];
  prendas: Opcion[] = [];
  buscarPrenda = '';

  /** El Encargado solo ve su sucursal: el backend la fuerza, no se ofrece el filtro. */
  readonly esEncargado = computed(() => this.auth.tieneRol(ROLES.ENCARGADO));

  /** Se activa después de hidratar (en SSR no existe la Web Speech API). */
  readonly vozDisponible = signal(false);

  private reloj: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => { this.pararReloj(); this.voz.detener(); });
    afterNextRender(() => this.vozDisponible.set(this.voz.soportado));
  }

  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.servicio.tipos().subscribe({
      next: (c) => this.catalogo.set(c),
      error: (e) => this.notif.errorHttp(e, 'No se pudo cargar el catálogo de reportes.'),
    });
    this.cargarListas();
  }

  // ---------- Pedido por texto o voz ----------

  dictar(): void {
    if (this.voz.escuchando()) { this.voz.detener(); return; }
    this.voz.escuchar({
      parcial: (t) => (this.texto = t),
      final: (t) => { this.texto = t; if (t) this.generar(); },
      error: (m) => this.notif.aviso(m, 'Micrófono'),
    });
  }

  usarEjemplo(ejemplo: string): void {
    this.texto = ejemplo;
    this.generar();
  }

  generar(): void {
    const texto = this.texto.trim();
    if (!texto || this.generando()) return;
    this.voz.detener();
    this.generando.set(true);
    this.iniciarReloj();
    this.servicio.generar(texto, true).subscribe({
      next: (r) => {
        this.respuesta.set(r);
        if (r.estado === 'OK' && r.reporte && r.intencion) {
          this.mostrar(r.reporte, r.intencion, r.narrativa ?? null, false);
        } else {
          this.reporte.set(null);
          this.intencion.set(null);
          this.narrativa.set(null);
          this.filtros = null;
        }
        this.terminar();
      },
      error: (e) => {
        this.terminar();
        this.notif.errorHttp(e, 'No se pudo generar el reporte.');
      },
    });
  }

  private terminar(): void {
    this.generando.set(false);
    this.pararReloj();
  }

  private iniciarReloj(): void {
    this.pararReloj();
    this.segundos.set(0);
    this.reloj = setInterval(() => this.segundos.update((s) => s + 1), 1000);
  }

  private pararReloj(): void {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = null;
  }

  private mostrar(reporte: ReporteGenerado, intencion: IntencionReporte, narrativa: string | null, editado: boolean): void {
    this.reporte.set(reporte);
    this.intencion.set({ ...intencion });
    this.narrativa.set(narrativa);
    this.filtrosEditados.set(editado);
    this.tipoGrafico.set(reporte.grafico?.tipo ?? intencion.grafico ?? 'tabla');
    this.filtros = clonar(intencion);
  }

  // ---------- Filtros editables (POST /ia/reportes/ejecutar, sin IA) ----------

  private cargarListas(): void {
    const api = environment.apiUrl;
    const aOpciones = (l: any[]) => (l ?? []).map((x) => ({ id: x.id, nombre: x.nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    this.http.get<any[]>(`${api}/catalogo/sucursales`).subscribe({ next: (l) => (this.sucursales = aOpciones(l)) });
    this.http.get<any[]>(`${api}/catalogo/categorias`).subscribe({ next: (l) => (this.categorias = aOpciones(l)) });
    this.http.get<any[]>(`${api}/catalogo/`).subscribe({ next: (l) => (this.prendas = aOpciones(l)) });
  }

  infoTipo(codigo: TipoReporte | undefined): TipoReporteInfo | undefined {
    return this.catalogo()?.tipos.find((t) => t.codigo === codigo);
  }

  admite(filtro: FiltroReporte): boolean {
    return !!this.infoTipo(this.filtros?.tipo)?.filtros.includes(filtro);
  }

  get usaFechas(): boolean {
    return !!this.infoTipo(this.filtros?.tipo)?.usa_fechas;
  }

  /** Al cambiar el tipo, las fechas y opciones vuelven a sus valores por defecto (los completa el backend). */
  cambiarTipo(tipo: TipoReporte): void {
    if (!this.filtros) return;
    this.filtros = {
      ...this.filtros, tipo, fecha_desde: null, fecha_hasta: null, agrupacion: null, limite: null, grafico: null,
    };
  }

  marcado(lista: number[], id: number): boolean {
    return lista.includes(id);
  }

  alternar(campo: 'sucursal_ids' | 'categoria_ids' | 'prenda_ids', id: number): void {
    if (!this.filtros) return;
    const l = this.filtros[campo];
    this.filtros[campo] = l.includes(id) ? l.filter((x) => x !== id) : [...l, id];
  }

  get prendasFiltradas(): Opcion[] {
    const q = this.buscarPrenda.trim().toLowerCase();
    const sel = this.filtros?.prenda_ids ?? [];
    const lista = q ? this.prendas.filter((p) => p.nombre.toLowerCase().includes(q) || sel.includes(p.id)) : this.prendas;
    return lista.slice(0, 60);
  }

  nombres(lista: Opcion[], ids: number[]): string {
    if (!ids.length) return 'Todas';
    return ids.map((id) => lista.find((o) => o.id === id)?.nombre ?? `#${id}`).join(', ');
  }

  restablecerFiltros(): void {
    const i = this.intencion();
    if (i) this.filtros = clonar(i);
  }

  aplicarFiltros(): void {
    if (!this.filtros || this.ejecutando()) return;
    const f = this.filtros;
    const info = this.infoTipo(f.tipo);
    const admite = (x: FiltroReporte) => !!info?.filtros.includes(x);
    const intencion: IntencionReporte = {
      tipo: f.tipo,
      fecha_desde: info?.usa_fechas ? (f.fecha_desde || null) : null,
      fecha_hasta: info?.usa_fechas ? (f.fecha_hasta || null) : null,
      agrupacion: admite('agrupacion') ? (f.agrupacion || null) : null,
      sucursal_ids: admite('sucursales') ? f.sucursal_ids : [],
      categoria_ids: admite('categorias') ? f.categoria_ids : [],
      prenda_ids: admite('productos') ? f.prenda_ids : [],
      canal: admite('canal') ? (f.canal || null) : null,
      limite: admite('limite') && f.limite ? Number(f.limite) : null,
      grafico: f.tipo === this.intencion()?.tipo ? this.tipoGrafico() : null,
    };
    this.ejecutando.set(true);
    this.servicio.ejecutar(intencion).subscribe({
      next: (r) => {
        // El resumen narrativo corresponde a la consulta original: con filtros nuevos no se muestra ni se exporta.
        this.mostrar(r.reporte, r.intencion, null, true);
        this.ejecutando.set(false);
      },
      error: (e) => {
        this.ejecutando.set(false);
        this.notif.errorHttp(e, 'No se pudo ejecutar el reporte con esos filtros.');
      },
    });
  }

  // ---------- Exportación ----------

  exportar(formato: FormatoExportacion): void {
    const intencion = this.intencion();
    if (!intencion || this.exportando()) return;
    this.exportando.set(formato);
    this.servicio.exportar({ ...intencion, grafico: this.tipoGrafico() }, formato, this.narrativa()).subscribe({
      next: ({ archivo, nombre }) => {
        const url = URL.createObjectURL(archivo);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.exportando.set(null);
      },
      error: (e) => {
        this.exportando.set(null);
        this.notif.errorHttp(e, `No se pudo generar el ${formato === 'pdf' ? 'PDF' : 'Excel'}.`);
      },
    });
  }

  // ---------- Tabla ----------

  readonly supuestos = computed(() => {
    const r = this.respuesta();
    const lista = [...(this.filtrosEditados() ? [] : r?.supuestos ?? []), ...(this.reporte()?.supuestos ?? [])];
    return [...new Set(lista)];
  });

  celda(col: ColumnaReporte, valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    if (typeof valor !== 'number') return String(valor);
    switch (col.tipo) {
      case 'moneda': return numero(valor, 2);
      case 'porcentaje': return `${numero(valor, 1)} %`;
      case 'entero': return numero(valor, Number.isInteger(valor) ? 0 : 1);
      default: return String(valor);
    }
  }

  esNumerica(col: ColumnaReporte): boolean {
    return col.tipo !== 'texto';
  }

  esAlerta(col: ColumnaReporte): boolean {
    return col.clave === 'alerta';
  }

  nivelAlerta(valor: unknown): NivelAlerta {
    const v = String(valor ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    if (v.startsWith('CRIT')) return 'critico';
    if (v.startsWith('ATEN')) return 'atencion';
    if (v.startsWith('OK')) return 'ok';
    return 'ninguna'; // sin stock físico (Tienda en línea): el backend manda '—'
  }

  // ---------- Gráfico ----------

  /** El reporte trae series para graficar (la evaluación de modelos es solo tabla). */
  readonly graficable = computed(() => {
    const r = this.reporte();
    return !!r && !r.vacio && !!r.grafico && r.grafico.series.length > 0;
  });

  cambiarGrafico(tipo: TipoGrafico): void {
    this.tipoGrafico.set(tipo);
    const i = this.intencion();
    if (i) this.intencion.set({ ...i, grafico: tipo });
  }

  readonly grafico = computed<GraficoListo | null>(() => {
    const r = this.reporte();
    const paleta = this.catalogo()?.paleta ?? [];
    const tipo = this.tipoGrafico();
    if (!r || !r.grafico || !this.graficable() || tipo === 'tabla' || !paleta.length) return null;

    const g = r.grafico;
    const etiquetas = r.filas.map((f) => String(f[g.eje_x] ?? ''));
    const tipoCol = (clave: string) => r.columnas.find((c) => c.clave === clave) ?? { clave, titulo: clave, tipo: 'entero' as const };
    const valores = (clave: string) => r.filas.map((f) => Number(f[clave]) || 0);

    if (tipo === 'torta') {
      const serie = g.series[0];
      const col = tipoCol(serie.clave);
      const config: ChartConfiguration<'pie'> = {
        type: 'pie',
        data: {
          labels: etiquetas,
          datasets: [{
            label: serie.titulo, data: valores(serie.clave),
            backgroundColor: etiquetas.map((_, i) => paleta[i % paleta.length]),
            borderColor: '#ffffff', borderWidth: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'right', labels: { boxWidth: 12 } },
            tooltip: { callbacks: { label: (c) => `${c.label}: ${this.celda(col, c.parsed)}` } },
          },
        },
      };
      return { config: config as GraficoListo['config'], alto: 320, soloPrimera: g.series.length > 1 ? serie.titulo : null };
    }

    const horizontal = tipo === 'barras' && HORIZONTALES.includes(r.tipo);
    const esLinea = tipo === 'lineas';
    const config: ChartConfiguration<'bar' | 'line'> = {
      type: esLinea ? 'line' : 'bar',
      data: {
        labels: etiquetas,
        // La serie i usa paleta[i], en orden y sin rotar.
        datasets: g.series.map((s, i) => ({
          label: s.titulo, data: valores(s.clave),
          backgroundColor: paleta[i % paleta.length], borderColor: paleta[i % paleta.length],
          borderWidth: esLinea ? 2 : 0, borderRadius: esLinea ? 0 : 3,
          tension: 0.25, pointRadius: 3, fill: false,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          legend: { display: g.series.length >= 2, position: 'top', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (c) => {
                const v = horizontal ? c.parsed.x : c.parsed.y;
                return `${c.dataset.label}: ${this.celda(tipoCol(g.series[c.datasetIndex].clave), v)}`;
              },
            },
          },
        },
        scales: {
          [horizontal ? 'x' : 'y']: { beginAtZero: true, ticks: { callback: (v: string | number) => numero(Number(v), 0) } },
          [horizontal ? 'y' : 'x']: {
            ticks: {
              autoSkip: !horizontal,
              callback: function (this: any, v: string | number) {
                const t = String(this.getLabelForValue(Number(v)));
                return t.length > 28 ? t.slice(0, 27) + '…' : t;
              },
            },
          },
        },
      },
    };
    const alto = horizontal ? Math.max(288, etiquetas.length * 26 + 60) : 320;
    return { config: config as GraficoListo['config'], alto, soloPrimera: null };
  });

  /** Clave para recrear el canvas al cambiar de tipo de gráfico o de reporte. */
  readonly claveGrafico = computed(() => {
    const r = this.reporte();
    return r ? `${r.tipo}-${r.generado_en}-${this.tipoGrafico()}` : '';
  });

  readonly tiposGrafico: { valor: TipoGrafico; nombre: string }[] = [
    { valor: 'barras', nombre: 'Barras' },
    { valor: 'lineas', nombre: 'Líneas' },
    { valor: 'torta', nombre: 'Torta' },
    { valor: 'tabla', nombre: 'Solo tabla' },
  ];

  readonly canales = [
    { valor: null, nombre: 'Todos' },
    { valor: 'WEB', nombre: 'Tienda en línea' },
    { valor: 'PRESENCIAL', nombre: 'Presencial' },
    { valor: 'OFFLINE', nombre: 'Sin conexión' },
  ];

  readonly agrupaciones = [
    { valor: null, nombre: 'Automática' },
    { valor: 'dia', nombre: 'Por día' },
    { valor: 'semana', nombre: 'Por semana' },
    { valor: 'mes', nombre: 'Por mes' },
  ];
}

function clonar(i: IntencionReporte): IntencionReporte {
  return {
    ...i,
    sucursal_ids: [...(i.sucursal_ids ?? [])],
    categoria_ids: [...(i.categoria_ids ?? [])],
    prenda_ids: [...(i.prenda_ids ?? [])],
  };
}
