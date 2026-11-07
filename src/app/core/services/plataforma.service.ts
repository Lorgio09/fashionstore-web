import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Suscripcion } from '../models/sesion';
import {
  CambioPlan,
  Empresa,
  EmpresaConSuscripcion,
  EmpresaNueva,
  EstadoEmpresa,
  Plan,
  PlanForm,
  SuscripcionHistorial,
} from '../models/saas';

/** Administrador de plataforma: empresas, planes y suscripciones (contrato §4, `/plataforma`). */
@Injectable({ providedIn: 'root' })
export class PlataformaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/plataforma`;

  // ---- Planes ----
  planes(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.api}/planes`);
  }
  crearPlan(p: PlanForm): Observable<Plan> {
    return this.http.post<Plan>(`${this.api}/planes`, p);
  }
  actualizarPlan(id: number, p: PlanForm): Observable<Plan> {
    return this.http.put<Plan>(`${this.api}/planes/${id}`, p);
  }

  // ---- Empresas ----
  empresas(): Observable<EmpresaConSuscripcion[]> {
    return this.http.get<EmpresaConSuscripcion[]>(`${this.api}/empresas`);
  }
  empresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.api}/empresas/${id}`);
  }
  registrarEmpresa(e: EmpresaNueva): Observable<unknown> {
    return this.http.post(`${this.api}/empresas`, e);
  }
  cambiarEstadoEmpresa(id: string, estado: EstadoEmpresa): Observable<unknown> {
    return this.http.patch(`${this.api}/empresas/${id}/estado`, { estado });
  }

  // ---- Suscripción ----
  suscripcion(id: string): Observable<Suscripcion> {
    return this.http.get<Suscripcion>(`${this.api}/empresas/${id}/suscripcion`);
  }
  historial(id: string): Observable<SuscripcionHistorial[]> {
    return this.http.get<SuscripcionHistorial[]>(`${this.api}/empresas/${id}/suscripciones`);
  }
  asignarPlan(id: string, c: CambioPlan): Observable<unknown> {
    const body: CambioPlan = { plan_codigo: c.plan_codigo, periodicidad: c.periodicidad };
    if (c.fecha_inicio) body.fecha_inicio = c.fecha_inicio;
    return this.http.post(`${this.api}/empresas/${id}/suscripcion`, body);
  }
  renovar(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/empresas/${id}/suscripcion/renovar`, {});
  }
  cambiarEstadoSuscripcion(id: string, estado: 'ACTIVA' | 'SUSPENDIDA'): Observable<unknown> {
    return this.http.patch(`${this.api}/empresas/${id}/suscripcion/estado`, { estado });
  }
}
