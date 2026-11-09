import { Injectable, computed, inject, signal } from '@angular/core';
import { OfflineRepository, nuevoUuid } from '../persistence/offline.repository';
import { DatosReserva, DatosVenta, EstadoOperacion, ItemOperacion, OperacionLocal } from '../models/offline';
import { AuthService } from './auth';
import { ahoraIsoLocal, fechaHoraLocalSinZona } from '../../shared/utils/fechas';

export interface ItemNuevo {
  variante_id: number;
  cantidad: number;
  precio_unitario?: number;
  nombre?: string;
  talla?: string;
  color?: string;
}

/**
 * Operaciones registradas sin red (capa de negocio, contrato §6): crea ventas de contado y reservas
 * en estado LOCAL y expone las del usuario actual con sus contadores.
 */
@Injectable({ providedIn: 'root' })
export class OperacionesOfflineService {
  private repo = inject(OfflineRepository);
  private auth = inject(AuthService);

  private readonly _operaciones = signal<OperacionLocal[]>([]);
  /** Operaciones del usuario logueado en su empresa, más recientes primero. */
  readonly operaciones = this._operaciones.asReadonly();

  readonly porEstado = computed(() => {
    const c: Record<EstadoOperacion, number> = { LOCAL: 0, ENVIADA: 0, CONFIRMADA: 0, RECHAZADA: 0, CONFLICTO: 0 };
    for (const o of this._operaciones()) c[o.estado]++;
    return c;
  });
  /** Por enviar (LOCAL + ENVIADA). */
  readonly pendientes = computed(() => this.porEstado().LOCAL + this.porEstado().ENVIADA);
  readonly conflictos = computed(() => this.porEstado().CONFLICTO);

  /** Recarga la lista del usuario actual desde IndexedDB. */
  async refrescar(): Promise<void> {
    const u = this.auth.usuario();
    const e = this.auth.empresa();
    if (!u || !e || !this.repo.disponible) {
      this._operaciones.set([]);
      return;
    }
    this._operaciones.set(await this.repo.operacionesDe(e.id, u.id));
  }

  /**
   * Ventas que este dispositivo todavía tiene en LOCAL para una sucursal (cierre de caja, §9.5 `pendientes_locales`).
   * Lee IndexedDB en el momento, para no depender de la última recarga de la lista.
   */
  async ventasLocalesDe(sucursalId: number): Promise<{ cantidad: number; monto_efectivo: number }> {
    await this.refrescar();
    const ventas = this._operaciones().filter((o) => o.tipo === 'VENTA' && o.estado === 'LOCAL' && o.sucursal_id === sucursalId);
    return {
      cantidad: ventas.length,
      monto_efectivo: redondear(ventas.reduce((s, o) => s + ((o.datos as DatosVenta).total ?? 0), 0)),
    };
  }

  /** Venta de contado sin red. Solo EFECTIVO (§6.2). */
  async registrarVenta(params: {
    sucursal_id: number;
    items: ItemNuevo[];
    cliente_id?: number | null;
    nombre_cliente?: string | null;
  }): Promise<OperacionLocal> {
    const items = this.normalizar(params.items, true);
    const total = redondear(items.reduce((s, i) => s + i.cantidad * (i.precio_unitario ?? 0), 0));
    const datos: DatosVenta = {
      metodo_pago: 'EFECTIVO',
      cliente_id: params.cliente_id ?? null,
      nombre_cliente: params.nombre_cliente?.trim() || 'Cliente ocasional',
      total,
      items,
    };
    return this.guardar('VENTA', params.sucursal_id, datos);
  }

  /** Reserva sin red. `fecha_visita` llega del <input type="datetime-local"> y se guarda en hora local sin zona. */
  async registrarReserva(params: {
    sucursal_id: number;
    fecha_visita: string;
    items: ItemNuevo[];
    cliente_id?: number | null;
  }): Promise<OperacionLocal> {
    const datos: DatosReserva = {
      cliente_id: params.cliente_id ?? null,
      fecha_visita: fechaHoraLocalSinZona(params.fecha_visita),
      items: this.normalizar(params.items, false),
    };
    return this.guardar('RESERVA', params.sucursal_id, datos);
  }

  private async guardar(tipo: 'VENTA' | 'RESERVA', sucursalId: number, datos: DatosVenta | DatosReserva): Promise<OperacionLocal> {
    const u = this.auth.usuario();
    const e = this.auth.empresa();
    if (!u || !e) throw new Error('Inicia sesión para registrar operaciones sin conexión.');
    if (!sucursalId) throw new Error('Elige una sucursal.');
    if (!datos.items.length) throw new Error('No hay productos.');

    const op: OperacionLocal = {
      uuid: nuevoUuid(), // clave de idempotencia (RNF05)
      tipo,
      empresa_id: e.id,
      sucursal_id: sucursalId,
      usuario_id: u.id,
      creado_en: ahoraIsoLocal(),
      estado: 'LOCAL',
      intentos: 0,
      ultimo_intento: null,
      ultimo_error: null,
      servidor_id: null,
      mensaje_servidor: null,
      datos,
    };
    await this.repo.agregarOperacion(op); // también descuenta el stock estimado
    await this.refrescar();
    return op;
  }

  /** Une ítems repetidos de la misma variante y valida cantidades. */
  private normalizar(items: ItemNuevo[], conPrecio: boolean): ItemOperacion[] {
    const mapa = new Map<number, ItemOperacion>();
    for (const i of items) {
      if (!(i.cantidad > 0)) continue;
      const previo = mapa.get(i.variante_id);
      if (previo) {
        previo.cantidad += i.cantidad;
      } else {
        mapa.set(i.variante_id, {
          variante_id: i.variante_id,
          cantidad: i.cantidad,
          ...(conPrecio ? { precio_unitario: redondear(Number(i.precio_unitario ?? 0)) } : {}),
          nombre: i.nombre,
          talla: i.talla,
          color: i.color,
        });
      }
    }
    return [...mapa.values()];
  }
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}
