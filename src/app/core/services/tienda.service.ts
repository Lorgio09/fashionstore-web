import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TiendaPublica } from '../models/publico';
import { PublicoService } from './publico.service';

const K_TIENDA = 'tienda_slug';

export type EstadoTienda = 'cargando' | 'ok' | 'no_existe' | 'error';

/**
 * Tienda (empresa) que ve el visitante. Se envía como header `X-Empresa` (contrato §2).
 * El slug lo fija la ruta `/tienda/:slug` (ver `tiendaGuard`); por compatibilidad también `?tienda=<slug>`.
 * Si no hay ninguno se usa la última tienda guardada o `environment.tiendaPorDefecto`.
 * Con token, el backend ignora el header y usa la empresa del usuario.
 */
@Injectable({ providedIn: 'root' })
export class TiendaService {
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private publico = inject(PublicoService);
  private cache = new Map<string, TiendaPublica>();

  private readonly _slug = signal<string>(environment.tiendaPorDefecto);
  readonly slug = this._slug.asReadonly();

  /** Datos públicos de la tienda actual (nombre, sucursales…) desde `GET /publico/tiendas/{slug}`. */
  readonly info = signal<TiendaPublica | null>(null);
  readonly estado = signal<EstadoTienda>('cargando');
  readonly nombre = computed(() => this.info()?.nombre ?? '');
  /** Raíz de la tienda actual, para armar enlaces: `/tienda/<slug>`. */
  readonly ruta = computed(() => `/tienda/${this._slug()}`);

  constructor() {
    if (!this.esNavegador) return;
    try {
      const deUrl = new URLSearchParams(window.location.search).get('tienda');
      const guardada = localStorage.getItem(K_TIENDA);
      // Solo se fija el slug: los datos se piden al entrar a /tienda/:slug (evita una dependencia circular con el interceptor).
      const inicial = (deUrl || guardada || '').trim().toLowerCase();
      if (inicial) this._slug.set(inicial);
      if (deUrl) localStorage.setItem(K_TIENDA, inicial);
    } catch {
      /* almacenamiento bloqueado: se usa la tienda por defecto */
    }
  }

  establecer(slug: string): void {
    const limpio = slug.trim().toLowerCase();
    if (!limpio) return;
    const cambio = limpio !== this._slug();
    this._slug.set(limpio);
    if (cambio || !this.info()) queueMicrotask(() => this.cargarInfo());
    if (!this.esNavegador) return;
    try {
      localStorage.setItem(K_TIENDA, limpio);
    } catch {
      /* ignorar */
    }
  }

  /** Carga los datos de la tienda actual si todavía no están (pantallas fuera de /tienda/:slug, p. ej. registro). */
  asegurar(): void {
    if (!this.info() && this.estado() !== 'no_existe') queueMicrotask(() => this.cargarInfo());
  }

  private cargarInfo(): void {
    if (!this.esNavegador) return;
    const slug = this._slug();
    const enCache = this.cache.get(slug);
    if (enCache) {
      this.info.set(enCache);
      this.estado.set('ok');
      return;
    }
    this.info.set(null);
    this.estado.set('cargando');
    this.publico.tienda(slug).subscribe({
      next: (t) => {
        this.cache.set(slug, t);
        try { localStorage.setItem(`tienda_info:${slug}`, JSON.stringify(t)); } catch { /* ignorar */ }
        if (this._slug() !== slug) return;
        this.info.set(t);
        this.estado.set('ok');
      },
      error: (e: HttpErrorResponse) => {
        if (this._slug() !== slug) return;
        // Sin red: se muestra la última copia guardada de la tienda (nombre, sucursales).
        if (e.status === 0) {
          try {
            const guardada = localStorage.getItem(`tienda_info:${slug}`);
            if (guardada) { this.info.set(JSON.parse(guardada)); this.estado.set('ok'); return; }
          } catch { /* ignorar */ }
        }
        this.estado.set(e.status === 404 ? 'no_existe' : 'error');
      },
    });
  }
}
