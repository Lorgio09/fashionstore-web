// Modelos de la operación offline (contrato §6). Persisten en IndexedDB (Dexie).

/** Estados locales: LOCAL → ENVIADA → CONFIRMADA | RECHAZADA | CONFLICTO. */
export type EstadoOperacion = 'LOCAL' | 'ENVIADA' | 'CONFIRMADA' | 'RECHAZADA' | 'CONFLICTO';
export const ESTADOS_FINALES: EstadoOperacion[] = ['CONFIRMADA', 'RECHAZADA'];

export type TipoOperacion = 'VENTA' | 'RESERVA';

// ---------- Catálogo para trabajar sin red (§6.1 GET /sync/catalogo) ----------

export interface SucursalLocal {
  id: number;
  nombre: string;
  direccion: string | null;
}

export interface CategoriaLocal {
  id: number;
  nombre: string;
}

export interface VarianteLocal {
  id: number;
  talla: string;
  color: string;
  codigo_sku: string;
}

export interface PrendaLocal {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  categoria_id: number;
  variantes: VarianteLocal[];
}

/** Variante "aplanada" con los datos de su prenda, para buscar por SKU sin recorrer prendas. */
export interface VarianteIndexada extends VarianteLocal {
  prenda_id: number;
  prenda_nombre: string;
  precio_base: number;
  imagen_url: string | null;
  categoria_id: number;
}

export interface InventarioLocal {
  variante_id: number;
  sucursal_id: number;
  /** Stock que envió el servidor al preparar. */
  stock_disponible: number;
  /** Stock estimado: el del servidor menos lo vendido/reservado offline en este dispositivo (§6 regla 5). */
  stock_estimado: number;
}

export interface ClienteLocal {
  id: number;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
}

export interface CatalogoSync {
  generado_en: string;
  vigencia_horas: number;
  empresa: { id: string; razon_social: string; slug: string };
  usuario: { id: number; nombre: string; rol_nombre: string; sucursal_id: number | null };
  sucursales: SucursalLocal[];
  categorias: CategoriaLocal[];
  prendas: PrendaLocal[];
  inventario: { variante_id: number; sucursal_id: number; stock_disponible: number }[];
  clientes?: ClienteLocal[];
}

/** Metadatos del catálogo guardado (para "Datos al <fecha>" y "desactualizado"). */
export interface MetaCatalogo {
  generado_en: string;
  vigencia_horas: number;
  guardado_en: string;
  empresa_id: string;
  empresa_slug: string;
  usuario_id: number;
  totales: { prendas: number; variantes: number; clientes: number; sucursales: number };
}

// ---------- Operaciones offline (§6.2) ----------

export interface ItemOperacion {
  variante_id: number;
  cantidad: number;
  /** Solo VENTA: precio unitario usado. */
  precio_unitario?: number;
  // Para mostrar sin red:
  nombre?: string;
  talla?: string;
  color?: string;
}

export interface DatosVenta {
  metodo_pago: 'EFECTIVO';
  cliente_id: number | null;
  nombre_cliente: string | null;
  total: number;
  items: ItemOperacion[];
}

export interface DatosReserva {
  cliente_id: number | null;
  /** Hora local de la tienda, sin zona: 'YYYY-MM-DDTHH:mm:ss'. */
  fecha_visita: string;
  items: ItemOperacion[];
}

export interface OperacionLocal {
  uuid: string;
  tipo: TipoOperacion;
  empresa_id: string;
  sucursal_id: number;
  usuario_id: number;
  /** ISO con zona local, p. ej. 2026-11-03T14:05:00-04:00 */
  creado_en: string;
  estado: EstadoOperacion;
  intentos: number;
  ultimo_intento: string | null;
  ultimo_error: string | null;
  servidor_id: number | null;
  mensaje_servidor: string | null;
  /** detalle del servidor (p. ej. ítems sin stock en un CONFLICTO). */
  detalle_servidor?: unknown;
  datos: DatosVenta | DatosReserva;
}

/** Resultado por operación de POST /sync/operaciones y /sync/estado. */
export interface ResultadoSync {
  uuid: string;
  estado: EstadoOperacion | 'ERROR' | 'DESCONOCIDA';
  servidor_id: number | null;
  duplicada?: boolean;
  mensaje?: string;
  detalle?: unknown;
}
