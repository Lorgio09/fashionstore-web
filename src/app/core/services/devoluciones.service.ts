import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Disponibilidad, FiltrosSolicitudes, FormaPago, FormaReembolso, HistorialSolicitudes, NotaCredito,
  PoliticaDevoluciones, ResultadoInspeccion, Solicitud, SolicitudNueva, VentaDevolucion,
} from '../models/devoluciones';

/**
 * Capa de negocio de devoluciones, cambios y notas de crédito (contrato §9.1).
 * Las reglas (plazos, cantidades, stock, máximos) las valida el servidor: sus 409 traen un `detail` legible.
 */
@Injectable({ providedIn: 'root' })
export class DevolucionesService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/devoluciones`;

  // ---- política (CU-09)
  politica(): Observable<PoliticaDevoluciones> {
    return this.http.get<PoliticaDevoluciones>(`${this.api}/politica`);
  }

  guardarPolitica(p: PoliticaDevoluciones): Observable<PoliticaDevoluciones> {
    const { vigente_desde, personalizada, ...cuerpo } = p;
    return this.http.put<PoliticaDevoluciones>(`${this.api}/politica`, cuerpo);
  }

  // ---- ventas
  /** Personal: por número de comprobante o por datos del cliente (mínimo 2 letras). */
  buscarVentas(criterio: { orden_id?: number; cliente?: string }): Observable<VentaDevolucion[]> {
    let params = new HttpParams();
    if (criterio.orden_id) params = params.set('orden_id', criterio.orden_id);
    if (criterio.cliente) params = params.set('cliente', criterio.cliente);
    return this.http.get<VentaDevolucion[]>(`${this.api}/ventas`, { params });
  }

  /** Cliente: sus compras con las prendas elegibles. */
  misCompras(): Observable<VentaDevolucion[]> {
    return this.http.get<VentaDevolucion[]>(`${this.api}/mis-compras`);
  }

  // ---- solicitudes
  crear(s: SolicitudNueva): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.api}/solicitudes`, s);
  }

  historial(f: FiltrosSolicitudes = {}): Observable<HistorialSolicitudes> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(f)) if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    return this.http.get<HistorialSolicitudes>(`${this.api}/solicitudes`, { params });
  }

  detalle(codigo: string): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.api}/solicitudes/${encodeURIComponent(codigo)}`);
  }

  autorizar(codigo: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(codigo)}/autorizar`, {});
  }

  inspeccionar(codigo: string, resultado: ResultadoInspeccion, observacion: string | null): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(codigo)}/inspeccionar`, { resultado, observacion });
  }

  /** CU-04: otra talla o color del mismo modelo. `detalle_id` es el id del ítem de la solicitud. */
  cambioVariante(codigo: string, items: { detalle_id: number; variante_id: number }[], forma_cobro: FormaPago | null): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(codigo)}/cambio-variante`, { items, forma_cobro });
  }

  /** CU-05: forma_cobro obligatoria si el producto nuevo cuesta más; si cuesta menos, se emite nota por la diferencia. */
  cambioProducto(codigo: string, items: { variante_id: number; cantidad: number }[], forma_cobro: FormaPago | null): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(codigo)}/cambio-producto`, { items, forma_cobro });
  }

  reembolso(codigo: string, forma: FormaReembolso): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(codigo)}/reembolso`, { forma });
  }

  sinStock(codigo: string, decision: 'NOTA_CREDITO' | 'ESPERAR_STOCK'): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(codigo)}/sin-stock`, { decision });
  }

  disponibilidad(varianteId: number): Observable<Disponibilidad> {
    return this.http.get<Disponibilidad>(`${this.api}/disponibilidad/${varianteId}`);
  }

  // ---- notas de crédito (CU-07)
  notas(): Observable<NotaCredito[]> {
    return this.http.get<NotaCredito[]>(`${this.api}/notas-credito`);
  }

  nota(codigo: string): Observable<NotaCredito> {
    return this.http.get<NotaCredito>(`${this.api}/notas-credito/${encodeURIComponent(codigo.trim().toUpperCase())}`);
  }

  private url(codigo: string): string {
    return `${this.api}/solicitudes/${encodeURIComponent(codigo)}`;
  }
}
