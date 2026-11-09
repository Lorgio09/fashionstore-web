import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanPublico, TiendaPublica } from '../models/publico';

/** Directorio público de la plataforma (§2.1): tiendas activas y planes, sin token. */
@Injectable({ providedIn: 'root' })
export class PublicoService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/publico`;

  tiendas(): Observable<TiendaPublica[]> {
    return this.http.get<TiendaPublica[]>(`${this.api}/tiendas`);
  }

  /** 404 si no existe o está suspendida. */
  tienda(slug: string): Observable<TiendaPublica> {
    return this.http.get<TiendaPublica>(`${this.api}/tiendas/${encodeURIComponent(slug)}`);
  }

  planes(): Observable<PlanPublico[]> {
    return this.http.get<PlanPublico[]>(`${this.api}/planes`);
  }
}
