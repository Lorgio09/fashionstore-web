import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export type TipoNotificacion = 'error' | 'exito' | 'aviso';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
}

/** Estados cuyo `detail` muestra el interceptor de errores automáticamente. */
export const ESTADOS_CON_DETALLE = [401, 403, 409, 422];

/** Avisos tipo "toast" visibles en toda la app. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private seq = 0;
  private readonly _items = signal<Notificacion[]>([]);
  readonly items = this._items.asReadonly();
  /** Errores HTTP que el interceptor ya mostró, para que las pantallas no los repitan. */
  private mostrados = new WeakSet<object>();

  error(mensaje: string, titulo = 'No se pudo completar'): void {
    this.agregar('error', titulo, mensaje, 8000);
  }

  exito(mensaje: string, titulo = 'Listo'): void {
    this.agregar('exito', titulo, mensaje, 4000);
  }

  aviso(mensaje: string, titulo = 'Atención'): void {
    this.agregar('aviso', titulo, mensaje, 6000);
  }

  cerrar(id: number): void {
    this._items.update((l) => l.filter((n) => n.id !== id));
  }

  marcarMostrado(err: object): void {
    this.mostrados.add(err);
  }

  /**
   * Para los `error:` de las pantallas: si el interceptor ya mostró el `detail`, no hace nada;
   * si no, muestra el `detail` del backend o, en su defecto, el mensaje genérico.
   */
  errorHttp(err: unknown, mensajePorDefecto: string): void {
    if (err && typeof err === 'object' && this.mostrados.has(err)) return;
    this.error(NotificacionService.detalle(err) ?? mensajePorDefecto);
  }

  /** Extrae el `detail` en español del backend (texto o lista de validación 422). */
  static detalle(err: unknown): string | null {
    if (!(err instanceof HttpErrorResponse)) return null;
    if (err.status === 0) return 'No hay conexión con el servidor.';
    const d = err.error?.detail;
    if (!d) return null;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d
        .map((e: any) => {
          const campo = Array.isArray(e?.loc) ? e.loc.filter((p: any) => p !== 'body').join('.') : '';
          return campo ? `${campo}: ${e?.msg ?? ''}` : (e?.msg ?? JSON.stringify(e));
        })
        .join(' · ');
    }
    return JSON.stringify(d);
  }

  private agregar(tipo: TipoNotificacion, titulo: string, mensaje: string, ms: number): void {
    const id = ++this.seq;
    this._items.update((l) => [...l.slice(-3), { id, tipo, titulo, mensaje }]);
    setTimeout(() => this.cerrar(id), ms);
  }
}
