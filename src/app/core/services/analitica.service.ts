import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardML, ModelosML } from '../models/analitica';

/** Capa de negocio de la analítica con ML (contrato §8). Cada empresa entrena con sus propios datos. */
@Injectable({ providedIn: 'root' })
export class AnaliticaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/ml`;

  /** Todo el dashboard analítico. El Encargado recibe solo su sucursal (lo fuerza el backend). */
  dashboard(sucursalId?: number | null): Observable<DashboardML> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursal_id', sucursalId);
    return this.http.get<DashboardML>(`${this.api}/dashboard`, { params });
  }

  /** Reentrena demanda y segmentación (solo Administrador; unos 7 s). */
  entrenar(): Observable<ModelosML> {
    return this.http.post<ModelosML>(`${this.api}/entrenar`, {});
  }
}
