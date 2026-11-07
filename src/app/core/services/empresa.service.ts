import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SucursalEmpresa } from '../models/saas';
import { AuthService } from './auth';

/** Administrador de empresa: sucursales con su estado (contrato §4, `/empresa`). */
@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = `${environment.apiUrl}/empresa`;

  /** Todas las sucursales, activas e inactivas. */
  sucursales(): Observable<SucursalEmpresa[]> {
    return this.http.get<SucursalEmpresa[]>(`${this.api}/sucursales`);
  }

  /** 409 si supera el límite del plan. Refresca el uso del plan. */
  crearSucursal(nombre: string, direccion?: string | null): Observable<SucursalEmpresa> {
    const body: { nombre: string; direccion?: string } = { nombre };
    if (direccion?.trim()) body.direccion = direccion.trim();
    return this.http
      .post<SucursalEmpresa>(`${this.api}/sucursales`, body)
      .pipe(tap(() => this.auth.cargarMiEmpresa()));
  }

  /** 409 al activar por encima del límite del plan. Refresca el uso del plan. */
  cambiarEstadoSucursal(id: number, activa: boolean): Observable<unknown> {
    return this.http
      .patch(`${this.api}/sucursales/${id}/estado`, { activa })
      .pipe(tap(() => this.auth.cargarMiEmpresa()));
  }
}
