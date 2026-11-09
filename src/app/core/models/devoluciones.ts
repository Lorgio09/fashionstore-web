// Devoluciones y cambios (CU-01 a CU-11) y notas de crédito (contrato §9).

export type MotivoDevolucion = 'TALLA' | 'AJUSTE_MEDIDA' | 'COLOR' | 'DEFECTO' | 'PRODUCTO_EQUIVOCADO' | 'YA_NO_LO_DESEA';
export type ResolucionDevolucion = 'CAMBIO_VARIANTE' | 'CAMBIO_PRODUCTO' | 'REEMBOLSO';
export type FormaPago = 'EFECTIVO' | 'QR' | 'TARJETA';
export type FormaReembolso = 'EFECTIVO' | 'MEDIO_ORIGINAL' | 'NOTA_CREDITO';
export type ResultadoInspeccion = 'APTA' | 'APTA_CON_DESCUENTO' | 'NO_APTA' | 'INCOMPLETA' | 'RECHAZAR';
export type AccionSolicitud = 'AUTORIZAR' | 'INSPECCIONAR' | 'CAMBIO_VARIANTE' | 'CAMBIO_PRODUCTO' | 'REEMBOLSO' | 'SIN_STOCK';
export type EstadoSolicitud =
  | 'EN_INSPECCION' | 'INSPECCIONADA' | 'PENDIENTE_STOCK' | 'CAMBIO_REALIZADO' | 'REEMBOLSADA' | 'CERRADA_CON_NOTA' | 'RECHAZADA';

export const MOTIVOS: { valor: MotivoDevolucion; nombre: string }[] = [
  { valor: 'TALLA', nombre: 'No le quedó la talla' },
  { valor: 'AJUSTE_MEDIDA', nombre: 'Ajuste de medida' },
  { valor: 'COLOR', nombre: 'Color' },
  { valor: 'DEFECTO', nombre: 'Defecto (garantía)' },
  { valor: 'PRODUCTO_EQUIVOCADO', nombre: 'Producto equivocado' },
  { valor: 'YA_NO_LO_DESEA', nombre: 'Ya no lo desea' },
];

export const RESOLUCIONES: { valor: ResolucionDevolucion; nombre: string }[] = [
  { valor: 'CAMBIO_VARIANTE', nombre: 'Cambio de talla o color' },
  { valor: 'CAMBIO_PRODUCTO', nombre: 'Cambio por otro producto' },
  { valor: 'REEMBOLSO', nombre: 'Reembolso' },
];

export const ESTADOS_SOLICITUD: { valor: EstadoSolicitud; nombre: string }[] = [
  { valor: 'EN_INSPECCION', nombre: 'En inspección' },
  { valor: 'INSPECCIONADA', nombre: 'Inspeccionada' },
  { valor: 'PENDIENTE_STOCK', nombre: 'Pendiente de stock' },
  { valor: 'CAMBIO_REALIZADO', nombre: 'Cambio realizado' },
  { valor: 'REEMBOLSADA', nombre: 'Reembolsada' },
  { valor: 'CERRADA_CON_NOTA', nombre: 'Cerrada con nota' },
  { valor: 'RECHAZADA', nombre: 'Rechazada' },
];

export function nombreResolucion(r: string | null | undefined): string {
  return RESOLUCIONES.find((x) => x.valor === r)?.nombre ?? (r === 'NOTA_CREDITO' ? 'Nota de crédito' : r ?? '—');
}

/** §9.2 — línea de una venta con lo que se puede devolver. */
export interface ItemVenta {
  detalle_orden_id: number;
  prenda_id?: number;
  variante_id?: number;
  prenda: string;
  talla: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  devuelto: number;
  elegible: number;
  cambios_realizados: number;
  retornable: boolean;
}

export interface VentaDevolucion {
  orden_id: number;
  fecha: string;
  canal: string;
  estado?: string;
  metodo_pago: string;
  sucursal_id?: number;
  sucursal: string;
  cliente_id?: number | null;
  nombre_cliente: string;
  total: number;
  limite_cambio: string;
  limite_garantia: string;
  items: ItemVenta[];
}

export interface SolicitudNueva {
  orden_id: number;
  items: { detalle_orden_id: number; cantidad: number }[];
  motivo: MotivoDevolucion;
  resolucion: ResolucionDevolucion;
  sucursal_id?: number | null;
  observacion?: string | null;
}

export interface ItemSolicitud {
  id: number;
  detalle_orden_id: number;
  variante_id: number;
  prenda: string;
  talla: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  entregado: { variante_id: number; prenda: string; talla: string; color: string } | null;
}

export interface NotaCreditoResumen {
  codigo: string;
  monto: number;
  saldo: number;
  vence_en: string;
}

/** §9.3 */
export interface Solicitud {
  codigo: string;
  estado: EstadoSolicitud;
  orden_id: number;
  canal: string; // TIENDA | EN_LINEA | OFFLINE
  cliente: { id: number; nombre: string } | null;
  sucursal: { id: number; nombre: string };
  motivo: MotivoDevolucion;
  motivo_texto: string;
  resolucion_pedida: ResolucionDevolucion;
  creado_en: string;
  requiere_autorizacion: boolean;
  autorizada: boolean;
  fuera_de_plazo: boolean;
  recargo: number;
  inspeccion: ResultadoInspeccion | null;
  inspeccionado_en?: string | null;
  observacion: string | null;
  valor_devuelto: number;
  monto_a_favor: number;
  resolucion: string | null;
  monto_reembolsado: number;
  forma_reembolso: string | null;
  reembolso_pendiente_procesador: boolean;
  monto_cobrado: number;
  forma_cobro: string | null;
  entregas: { variante_id: number; talla: string; color: string; cantidad: number; precio_unitario: number; prenda?: string }[];
  nota_credito: NotaCreditoResumen | null;
  cerrado_en?: string | null;
  items: ItemSolicitud[];
  acciones: AccionSolicitud[];
}

export interface TotalesSolicitudes {
  solicitudes: number;
  monto_reembolsado: number;
  cambios_realizados: number;
  notas_credito_emitidas: number;
  por_estado: Record<string, number>;
  por_motivo: { motivo: string; motivo_texto: string; cantidad: number }[];
}

export interface HistorialSolicitudes {
  totales: TotalesSolicitudes;
  solicitudes: Solicitud[];
}

export interface FiltrosSolicitudes {
  estado?: string | null;
  sucursal_id?: number | null;
  motivo?: string | null;
  desde?: string | null;
  hasta?: string | null;
}

export interface Disponibilidad {
  prenda_id: number;
  variante_id: number;
  en_sucursales: { sucursal_id: number; sucursal: string; variante_id: number; talla: string; color: string; stock: number }[];
}

export interface NotaCredito {
  codigo: string;
  cliente: { id: number; nombre: string } | null;
  monto: number;
  saldo: number;
  emitida_en: string;
  vence_en: string;
  estado: 'VIGENTE' | 'USADA' | 'VENCIDA';
  movimientos: { tipo: string; monto: number; orden_id: number | null; fecha: string }[];
}

export interface PoliticaDevoluciones {
  plazo_cambio_dias: number;
  plazo_garantia_dias: number;
  categorias_no_retornables: number[];
  max_cambios_por_prenda: number;
  max_devoluciones_mes_cliente: number;
  fuera_de_plazo: 'RECHAZAR' | 'RECARGO';
  recargo_pct: number;
  vigencia_nota_credito_dias: number;
  umbral_diferencia_caja: number;
  vigente_desde?: string | null;
  personalizada?: boolean;
}
