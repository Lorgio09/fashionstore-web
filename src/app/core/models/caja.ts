// Caja de la sucursal (CU-20, contrato §9.5).

export type EstadoCaja = 'ABIERTA' | 'CERRADA' | 'PENDIENTE_AUTORIZACION';

export interface ArqueoCaja {
  fondo_inicial: number;
  ventas: {
    cantidad: number;
    offline_sincronizadas: number;
    total: number;
    por_metodo: { metodo_pago: string; ventas: number; total: number }[];
    pagado_con_nota_credito: number;
  };
  /** Presenciales y offline ya sincronizadas, menos lo pagado con nota de crédito. */
  ventas_efectivo: number;
  cobros_cambios_efectivo: number;
  reembolsos_efectivo: number;
  devoluciones_atendidas: number;
  efectivo_esperado: number;
}

export interface PendientesLocales {
  cantidad: number;
  monto_efectivo: number;
}

export interface TurnoCaja {
  id: number;
  estado: EstadoCaja;
  sucursal: { id: number; nombre: string };
  abierto_por: string | null;
  abierto_en: string;
  fondo_inicial: number;
  cerrado_por: string | null;
  cerrado_en: string | null;
  efectivo_contado: number | null;
  efectivo_esperado: number | null;
  diferencia: number | null;
  observacion: string | null;
  pendientes_locales: PendientesLocales | null;
  autorizado_por: string | null;
  /** En vivo si está ABIERTA; el resumen guardado si está cerrada. */
  arqueo: ArqueoCaja | null;
}
