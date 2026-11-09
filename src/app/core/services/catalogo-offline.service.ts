import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfflineRepository } from '../persistence/offline.repository';
import { CatalogoSync, MetaCatalogo, SucursalLocal } from '../models/offline';
import { AuthService } from './auth';
import { ConexionService } from './conexion.service';

/** Producto vendible en el POS (una variante con su stock en la sucursal). */
export interface ProductoPOS {
  prenda_id: number;
  variante_id: number;
  nombre: string;
  precio: number;
  imagen_url: string | null;
  talla: string;
  color: string;
  codigo_sku?: string;
  /** Solo offline: stock estimado en la sucursal. */
  stock?: number;
}

/** Sección de la tienda en el formato de GET /catalogo/agrupado/secciones. */
export interface SeccionTienda {
  id_seccion: number;
  nombre_seccion: string;
  prendas: {
    prenda_id: number;
    nombre: string;
    precio: number;
    imagen_url: string | null;
    variantes: { id: number; talla: string; color: string }[];
  }[];
}

/**
 * Catálogo para trabajar sin red (contrato §6.1): "Preparar modo offline", fecha de los datos,
 * aviso de desactualizado y consultas locales con el formato que usan las pantallas.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoOfflineService {
  private http = inject(HttpClient);
  private repo = inject(OfflineRepository);
  private auth = inject(AuthService);
  private conexion = inject(ConexionService);

  private readonly _meta = signal<MetaCatalogo | null>(null);
  readonly meta = this._meta.asReadonly();
  readonly preparando = signal(false);
  /** Reloj para recalcular "desactualizado" sin recargar. */
  private readonly ahora = signal(Date.now());

  /** El catálogo guardado es de la empresa y el usuario de la sesión actual. */
  readonly esDeLaSesion = computed(() => {
    const m = this._meta();
    const u = this.auth.usuario();
    const e = this.auth.empresa();
    return !!m && !!u && !!e && m.empresa_id === e.id && m.usuario_id === u.id;
  });

  readonly vencido = computed(() => {
    const m = this._meta();
    if (!m) return false;
    return this.ahora() - new Date(m.generado_en).getTime() > m.vigencia_horas * 3600_000;
  });

  /** §6.1: desactualizado si pasó la vigencia o si se está sin red. */
  readonly desactualizado = computed(() => this.vencido() || !this.conexion.enLinea());

  constructor() {
    this.recargarMeta();
    if (typeof window !== 'undefined') setInterval(() => this.ahora.set(Date.now()), 60_000);
  }

  async recargarMeta(): Promise<void> {
    this._meta.set(await this.repo.metaCatalogo());
  }

  /** Descarga GET /sync/catalogo y reemplaza el catálogo local. */
  async preparar(): Promise<MetaCatalogo | null> {
    this.preparando.set(true);
    try {
      const c = await firstValueFrom(this.http.get<CatalogoSync>(`${environment.apiUrl}/sync/catalogo`));
      const meta = await this.repo.guardarCatalogo(c);
      this._meta.set(meta);
      this.ahora.set(Date.now());
      return meta;
    } finally {
      this.preparando.set(false);
    }
  }

  /** true si hay catálogo local utilizable para esta sesión. */
  async disponible(): Promise<boolean> {
    if (!this._meta()) await this.recargarMeta();
    return this.esDeLaSesion();
  }

  async sucursales(): Promise<SucursalLocal[]> {
    return this.repo.sucursales();
  }

  /** Productos del POS para una sucursal, con stock estimado. */
  async productosPOS(sucursalId: number): Promise<ProductoPOS[]> {
    const [variantes, inv] = await Promise.all([this.repo.variantes(), this.repo.inventarioDeSucursal(sucursalId)]);
    return variantes
      .map((v) => ({
        prenda_id: v.prenda_id,
        variante_id: v.id,
        nombre: v.prenda_nombre,
        precio: v.precio_base,
        imagen_url: v.imagen_url,
        talla: v.talla,
        color: v.color,
        codigo_sku: v.codigo_sku,
        stock: inv.get(v.id)?.stock_estimado ?? 0,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre) || a.talla.localeCompare(b.talla));
  }

  /** Tienda pública armada desde el catálogo local (mismo formato que /catalogo/agrupado/secciones). */
  async seccionesTienda(): Promise<SeccionTienda[]> {
    const [categorias, prendas] = await Promise.all([this.repo.categorias(), this.repo.prendas()]);
    return categorias
      .map((c) => ({
        id_seccion: c.id,
        nombre_seccion: c.nombre,
        prendas: prendas
          .filter((p) => p.categoria_id === c.id)
          .map((p) => ({
            prenda_id: p.id,
            nombre: p.nombre,
            precio: p.precio_base,
            imagen_url: p.imagen_url,
            variantes: p.variantes.map((v) => ({ id: v.id, talla: v.talla, color: v.color })),
          })),
      }))
      .filter((s) => s.prendas.length > 0);
  }

  /** Detalle de prenda local con el stock estimado sumado en todas las sucursales guardadas. */
  async detallePrenda(id: number) {
    const p = await this.repo.prenda(id);
    if (!p) return null;
    const variantes = await Promise.all(
      p.variantes.map(async (v) => {
        const filas = await this.repo.inventarioDeVariante(v.id);
        return { id: v.id, talla: v.talla, color: v.color, sku: v.codigo_sku, stock: filas.reduce((s, f) => s + f.stock_estimado, 0) };
      }),
    );
    return { prenda: { id: p.id, nombre: p.nombre, descripcion: p.descripcion, precio_base: p.precio_base, imagen_url: p.imagen_url }, variantes };
  }

  /** Sucursales con stock estimado suficiente para todos los ítems (equivale a /catalogo/sucursales-disponibles). */
  async sucursalesConStock(items: { variante_id: number; cantidad: number }[]): Promise<SucursalLocal[]> {
    const sucursales = await this.repo.sucursales();
    const res: SucursalLocal[] = [];
    for (const s of sucursales) {
      const inv = await this.repo.inventarioDeSucursal(s.id);
      if (items.every((i) => (inv.get(i.variante_id)?.stock_estimado ?? 0) >= i.cantidad)) res.push(s);
    }
    return res;
  }
}
