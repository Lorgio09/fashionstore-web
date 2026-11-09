import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PendientesLocales, TurnoCaja } from '../models/caja';

/**
 * Caja de la sucursal (CU-20, §9.5). `sucursal_id` solo lo usa el Administrador;
 * para el Cajero y el Encargado el servidor toma la sucursal asignada.
 */
@Injectable({ providedIn: 'root' })
export class CajaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/caja`;

  abrir(fondo_inicial: number, sucursalId?: number | null): Observable<TurnoCaja> {
    return this.http.post<TurnoCaja>(`${this.api}/abrir`, { fondo_inicial, ...(sucursalId ? { sucursal_id: sucursalId } : {}) });
  }

  /** Caja abierta con el arqueo en vivo. 404 si no hay ninguna. */
  actual(sucursalId?: number | null): Observable<TurnoCaja> {
    return this.http.get<TurnoCaja>(`${this.api}/actual`, { params: this.params(sucursalId) });
  }

  /**
   * Cierre con el efectivo contado. Con diferencia, la observación es obligatoria (422).
   * Si supera el umbral y cierra un Cajero, queda PENDIENTE_AUTORIZACION.
   */
  cerrar(sucursalId: number | null | undefined, efectivo_contado: number, observacion: string | null,
         pendientes_locales: PendientesLocales | null): Observable<TurnoCaja> {
    return this.http.post<TurnoCaja>(`${this.api}/cerrar`, { efectivo_contado, observacion, pendientes_locales },
      { params: this.params(sucursalId) });
  }

  /** Encargado o Administrador. */
  autorizar(turnoId: number): Observable<TurnoCaja> {
    return this.http.post<TurnoCaja>(`${this.api}/${turnoId}/autorizar`, {});
  }

  turnos(sucursalId?: number | null): Observable<TurnoCaja[]> {
    return this.http.get<TurnoCaja[]>(`${this.api}/turnos`, { params: this.params(sucursalId) });
  }

  private params(sucursalId?: number | null): HttpParams {
    return sucursalId ? new HttpParams().set('sucursal_id', sucursalId) : new HttpParams();
  }
}
