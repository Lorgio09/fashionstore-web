// Analítica inteligente con Machine Learning (contrato §8).

export interface Indicador {
  valor: number;
  anterior: number;
  variacion_pct: number | null;
}

export interface IndicadoresML {
  ventas_mes: Indicador;
  cantidad_ventas_mes: Indicador;
  ticket_promedio: Indicador;
  unidades_mes: Indicador;
  clientes_activos_30_dias: Indicador;
}

/** Un día de la serie: real (pasado) o predicción con rango (futuro). Unidades por día. */
export interface PuntoSerie {
  fecha: string;
  real: number | null;
  prediccion: number | null;
  minimo: number | null;
  maximo: number | null;
}

export interface Segmento {
  segmento: string;
  clientes: number;
  porcentaje: number;
  recencia_dias: number;
  frecuencia: number;
  monto_total: number;
  ticket_promedio: number;
  pct_premium: number;
  descripcion: string;
  accion_sugerida: string;
}

export interface AlertaReposicion {
  producto: string;
  talla: string;
  color: string;
  sucursal: string;
  stock: number;
  demanda_diaria: number;
  cobertura_dias: number;
  sugerido_reponer: number;
  alerta: string; // CRÍTICO | ATENCIÓN
}

export interface VariableDescartada {
  variable: string;
  motivo: string;
}

export interface ModeloML {
  tipo?: string;
  version: number;
  algoritmo: string;
  entrenado_en: string;
  parametros: Record<string, any> & { variables?: string[]; variables_descartadas?: VariableDescartada[] };
  datos: Record<string, any>;
  metricas: Record<string, any>;
  /** Presente si el modelo no se pudo entrenar (sin datos suficientes). */
  error?: string;
}

export interface ModelosML {
  demanda?: ModeloML | null;
  segmentacion?: ModeloML | null;
}

export interface DashboardML {
  generado_en: string;
  comparacion: string;
  indicadores: IndicadoresML;
  serie: PuntoSerie[];
  segmentos: Segmento[];
  alertas_reposicion: AlertaReposicion[];
  modelos: ModelosML;
  avisos: string[];
}
