import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, from, map, of, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogoReportes, FormatoExportacion, IntencionReporte, RespuestaEjecutar, RespuestaReporteIA,
} from '../models/reportes';

/**
 * Capa de negocio de los reportes generativos (contrato §7).
 * La IA solo interpreta el pedido; los datos los calcula el backend.
 */
@Injectable({ providedIn: 'root' })
export class ReportesIaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/ia/reportes`;
  private catalogo$?: Observable<CatalogoReportes>;

  /** Tipos, ejemplos y paleta (se pide una vez por sesión de pantalla). */
  tipos(): Observable<CatalogoReportes> {
    this.catalogo$ ??= this.http.get<CatalogoReportes>(`${this.api}/tipos`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((e) => { this.catalogo$ = undefined; return throwError(() => e); }),
    );
    return this.catalogo$;
  }

  /** Interpreta el texto (Gemini o reglas), ejecuta y redacta el resumen. */
  generar(texto: string, narrativa = true): Observable<RespuestaReporteIA> {
    return this.http.post<RespuestaReporteIA>(this.api, { texto, narrativa });
  }

  /** Vuelve a ejecutar con filtros editados, sin gastar IA. */
  ejecutar(intencion: IntencionReporte): Observable<RespuestaEjecutar> {
    return this.http.post<RespuestaEjecutar>(`${this.api}/ejecutar`, { intencion });
  }

  /** Descarga el PDF o Excel. El nombre llega en Content-Disposition. */
  exportar(intencion: IntencionReporte, formato: FormatoExportacion, narrativa: string | null)
    : Observable<{ archivo: Blob; nombre: string }> {
    return this.http.post(`${this.api}/exportar`, { intencion, formato, narrativa },
      { responseType: 'blob', observe: 'response' }).pipe(
      map((r) => ({
        archivo: r.body as Blob,
        nombre: nombreDeArchivo(r.headers.get('Content-Disposition')) ?? `${intencion.tipo}.${formato}`,
      })),
      // Con responseType 'blob' el error también llega como Blob: se lee el JSON para tener el `detail`.
      catchError((err) => errorConDetalle(err)),
    );
  }
}

function nombreDeArchivo(cabecera: string | null): string | null {
  if (!cabecera) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecera);
  if (utf8) return decodeURIComponent(utf8[1]);
  const simple = /filename="?([^";]+)"?/i.exec(cabecera);
  return simple ? simple[1] : null;
}

function errorConDetalle(err: unknown): Observable<never> {
  if (!(err instanceof HttpErrorResponse) || !(err.error instanceof Blob)) return throwError(() => err);
  return from(err.error.text()).pipe(
    catchError(() => of('')),
    switchMap((texto) => {
      let cuerpo: unknown = null;
      try { cuerpo = JSON.parse(texto); } catch { /* no es JSON */ }
      return throwError(() => new HttpErrorResponse({
        error: cuerpo, status: err.status, statusText: err.statusText, headers: err.headers, url: err.url ?? undefined,
      }));
    }),
  );
}
