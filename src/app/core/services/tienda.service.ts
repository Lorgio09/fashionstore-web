import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

const K_TIENDA = 'tienda_slug';

/**
 * Tienda (empresa) que ve el visitante anónimo. Se envía como header `X-Empresa` (contrato §2).
 * Orden: `?tienda=<slug>` en la URL → última tienda guardada → `environment.tiendaPorDefecto`.
 * Con token, el backend ignora el header y usa la empresa del usuario.
 */
@Injectable({ providedIn: 'root' })
export class TiendaService {
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _slug = signal<string>(environment.tiendaPorDefecto);
  readonly slug = this._slug.asReadonly();

  constructor() {
    if (!this.esNavegador) return;
    try {
      const deUrl = new URLSearchParams(window.location.search).get('tienda');
      if (deUrl) this.establecer(deUrl);
      else {
        const guardada = localStorage.getItem(K_TIENDA);
        if (guardada) this._slug.set(guardada);
      }
    } catch {
      /* almacenamiento bloqueado: se usa la tienda por defecto */
    }
  }

  establecer(slug: string): void {
    const limpio = slug.trim().toLowerCase();
    if (!limpio) return;
    this._slug.set(limpio);
    if (!this.esNavegador) return;
    try {
      localStorage.setItem(K_TIENDA, limpio);
    } catch {
      /* ignorar */
    }
  }
}
