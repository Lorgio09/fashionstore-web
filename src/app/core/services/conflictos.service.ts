import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResultadoSync } from '../models/offline';

export interface ItemConflicto {
  variante_id: number;
  prenda: string;
  talla: string;
  color: string;
  cantidad: number;
  precio_unitario?: number;
  stock_actual: number;
}

export interface Conflicto {
  uuid: string;
  tipo: 'VENTA' | 'RESERVA' | 'CAMBIO';
  estado: 'CONFLICTO';
  sucursal: { id: number; nombre: string };
  usuario: { id: number; nombre: string };
  creado_en: string;
  recibido_en: string;
  mensaje: string;
  datos: {
    metodo_pago?: string; total?: number; nombre_cliente?: string | null; cliente_id?: number | null; fecha_visita?: string;
    // CAMBIO (§6.5): los `items` del conflicto son las prendas a entregar.
    orden_id?: number | null; venta_uuid?: string | null; motivo?: string; inspeccion?: string;
    devueltos?: { detalle_orden_id?: number; variante_id?: number; cantidad: number }[];
    diferencia?: number; forma_cobro?: string | null; observacion?: string | null;
  };
  items: ItemConflicto[];
}

/** Conflictos de sincronización (contrato §6.4). Solo Encargado y Administrador. */
@Injectable({ providedIn: 'root' })
export class ConflictosService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/sync/conflictos`;

  listar(sucursalId?: number | null): Observable<Conflicto[]> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursal_id', sucursalId);
    return this.http.get<Conflicto[]>(this.api, { params });
  }

  rechazar(uuid: string, motivo: string): Observable<ResultadoSync> {
    return this.http.post<ResultadoSync>(`${this.api}/${uuid}/resolver`, { accion: 'RECHAZAR', motivo });
  }

  /** Cantidades iguales o menores a las originales; un ítem omitido se quita. 409 si aún no alcanza el stock. */
  ajustar(uuid: string, items: { variante_id: number; cantidad: number }[]): Observable<ResultadoSync> {
    return this.http.post<ResultadoSync>(`${this.api}/${uuid}/resolver`, { accion: 'AJUSTAR', items });
  }

  /** CAMBIO: no se ajustan cantidades; AJUSTAR sin `items` reintenta el cambio tal cual (409 si aún no hay stock). */
  reintentarCambio(uuid: string): Observable<ResultadoSync> {
    return this.http.post<ResultadoSync>(`${this.api}/${uuid}/resolver`, { accion: 'AJUSTAR' });
  }
}
