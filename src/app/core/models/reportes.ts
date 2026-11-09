// Reportes generativos con IA (contrato §7).

export type TipoReporte =
  | 'ventas_por_periodo' | 'ventas_por_sucursal' | 'productos_mas_vendidos' | 'ingresos_por_categoria'
  | 'stock_bajo' | 'devoluciones_por_motivo' | 'prediccion_demanda' | 'segmentos_clientes' | 'evaluacion_modelos';

export type TipoGrafico = 'barras' | 'lineas' | 'torta' | 'tabla';
export type Agrupacion = 'dia' | 'semana' | 'mes';
export type Canal = 'WEB' | 'PRESENCIAL' | 'OFFLINE';

/** Filtro que admite un tipo de reporte (`GET /ia/reportes/tipos`). */
export type FiltroReporte = 'sucursales' | 'categorias' | 'productos' | 'canal' | 'agrupacion' | 'limite';

export interface TipoReporteInfo {
  codigo: TipoReporte;
  nombre: string;
  descripcion: string;
  usa_fechas: boolean;
  filtros: FiltroReporte[];
  grafico: TipoGrafico;
  ejemplos: string[];
}

export interface CatalogoReportes {
  tipos: TipoReporteInfo[];
  ejemplos: string[];
  /** Colores de las series, en orden: la serie i usa paleta[i]. */
  paleta: string[];
  ia_disponible: boolean;
}

/** §7.2 — lo que se edita en los filtros. */
export interface IntencionReporte {
  tipo: TipoReporte;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  agrupacion: Agrupacion | null;
  sucursal_ids: number[];
  categoria_ids: number[];
  prenda_ids: number[];
  canal: Canal | null;
  limite: number | null;
  grafico: TipoGrafico | null;
}

export type TipoColumna = 'texto' | 'entero' | 'moneda' | 'porcentaje';

export interface ColumnaReporte {
  clave: string;
  titulo: string;
  tipo: TipoColumna;
}

export interface SerieGrafico {
  clave: string;
  titulo: string;
}

export interface ReporteGenerado {
  tipo: TipoReporte;
  titulo: string;
  subtitulo: string;
  empresa: string;
  generado_por: string;
  generado_en: string;
  filtros: { campo: string; valor: string }[];
  supuestos: string[];
  columnas: ColumnaReporte[];
  filas: Record<string, any>[];
  totales: Record<string, any> | null;
  grafico: { tipo: TipoGrafico; eje_x: string; series: SerieGrafico[] } | null;
  vacio: boolean;
}

export type EstadoReporte = 'OK' | 'ACLARACION' | 'NO_SOPORTADO';

/** §7.3 — respuesta de `POST /ia/reportes`. */
export interface RespuestaReporteIA {
  estado: EstadoReporte;
  texto: string;
  interprete: 'gemini' | 'reglas';
  intencion: IntencionReporte | null;
  supuestos: string[];
  mensaje: string | null;
  sugerencias: string[];
  narrativa: string | null;
  narrativa_origen?: string | null;
  reporte: ReporteGenerado | null;
}

/** Respuesta de `POST /ia/reportes/ejecutar` (sin IA). */
export interface RespuestaEjecutar {
  intencion: IntencionReporte;
  reporte: ReporteGenerado;
}

export type FormatoExportacion = 'pdf' | 'xlsx';
