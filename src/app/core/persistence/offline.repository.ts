import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FashionStoreDB } from './fashionstore-db';
import {
  CatalogoSync,
  CategoriaLocal,
  ClienteLocal,
  EstadoOperacion,
  InventarioLocal,
  MetaCatalogo,
  OperacionLocal,
  PrendaLocal,
  SucursalLocal,
  VarianteIndexada,
} from '../models/offline';

const K_META_CATALOGO = 'catalogo';
const K_DISPOSITIVO = 'dispositivo_id';
const PENDIENTES: EstadoOperacion[] = ['LOCAL', 'ENVIADA'];

/**
 * Capa de persistencia local (RNF07): única puerta a IndexedDB.
 * Los servicios de negocio y sincronización usan este repositorio; nunca Dexie directamente.
 * En SSR no hay IndexedDB: todos los métodos devuelven vacío y `disponible` es false.
 */
@Injectable({ providedIn: 'root' })
export class OfflineRepository {
  private readonly db: FashionStoreDB | null =
    isPlatformBrowser(inject(PLATFORM_ID)) && typeof indexedDB !== 'undefined' ? new FashionStoreDB() : null;

  get disponible(): boolean {
    return this.db !== null;
  }

  /** Abre la base (crea las tablas la primera vez) y asegura el id del dispositivo. */
  async inicializar(): Promise<void> {
    if (!this.db) return;
    await this.db.open();
    await this.dispositivoId();
  }

  /** Identificador estable del dispositivo para POST /sync/operaciones. */
  async dispositivoId(): Promise<string> {
    if (!this.db) return '';
    const fila = await this.db.meta.get(K_DISPOSITIVO);
    if (fila?.valor) return fila.valor as string;
    const id = nuevoUuid();
    await this.db.meta.put({ clave: K_DISPOSITIVO, valor: id });
    return id;
  }

  // ===================== Catálogo =====================

  /**
   * Reemplaza el catálogo local por el de GET /sync/catalogo.
   * El stock estimado descuenta las operaciones aún no sincronizadas de este dispositivo (§6 regla 5).
   */
  async guardarCatalogo(c: CatalogoSync): Promise<MetaCatalogo | null> {
    const db = this.db;
    if (!db) return null;

    const variantes: VarianteIndexada[] = c.prendas.flatMap((p) =>
      p.variantes.map((v) => ({
        ...v,
        prenda_id: p.id,
        prenda_nombre: p.nombre,
        precio_base: p.precio_base,
        imagen_url: p.imagen_url,
        categoria_id: p.categoria_id,
      })),
    );

    const meta: MetaCatalogo = {
      generado_en: c.generado_en,
      vigencia_horas: c.vigencia_horas,
      guardado_en: new Date().toISOString(),
      empresa_id: c.empresa.id,
      empresa_slug: c.empresa.slug,
      usuario_id: c.usuario.id,
      totales: {
        prendas: c.prendas.length,
        variantes: variantes.length,
        clientes: c.clientes?.length ?? 0,
        sucursales: c.sucursales.length,
      },
    };

    await db.transaction(
      'rw',
      [db.meta, db.sucursales, db.categorias, db.prendas, db.variantes, db.inventario, db.clientes, db.operaciones],
      async () => {
        // Lo que este dispositivo vendió/reservó y el servidor aún no conoce.
        const pendientes = await db.operaciones
          .where('estado')
          .anyOf(PENDIENTES)
          .filter((o) => o.empresa_id === c.empresa.id)
          .toArray();
        const comprometido = new Map<string, number>();
        for (const op of pendientes) {
          for (const it of op.datos.items) {
            const k = `${it.variante_id}:${op.sucursal_id}`;
            comprometido.set(k, (comprometido.get(k) ?? 0) + it.cantidad);
          }
        }
        const inventario: InventarioLocal[] = c.inventario.map((i) => ({
          ...i,
          stock_estimado: Math.max(0, i.stock_disponible - (comprometido.get(`${i.variante_id}:${i.sucursal_id}`) ?? 0)),
        }));

        await Promise.all([
          db.sucursales.clear(), db.categorias.clear(), db.prendas.clear(),
          db.variantes.clear(), db.inventario.clear(), db.clientes.clear(),
        ]);
        await db.sucursales.bulkPut(c.sucursales);
        await db.categorias.bulkPut(c.categorias);
        await db.prendas.bulkPut(c.prendas);
        await db.variantes.bulkPut(variantes);
        await db.inventario.bulkPut(inventario);
        await db.clientes.bulkPut(c.clientes ?? []);
        await db.meta.put({ clave: K_META_CATALOGO, valor: meta });
      },
    );
    return meta;
  }

  async metaCatalogo(): Promise<MetaCatalogo | null> {
    if (!this.db) return null;
    return ((await this.db.meta.get(K_META_CATALOGO))?.valor as MetaCatalogo) ?? null;
  }

  /** Borra el catálogo (p. ej. al iniciar sesión con otra empresa). Las operaciones se conservan. */
  async borrarCatalogo(): Promise<void> {
    const db = this.db;
    if (!db) return;
    await db.transaction('rw', [db.meta, db.sucursales, db.categorias, db.prendas, db.variantes, db.inventario, db.clientes], async () => {
      await Promise.all([
        db.sucursales.clear(), db.categorias.clear(), db.prendas.clear(),
        db.variantes.clear(), db.inventario.clear(), db.clientes.clear(),
        db.meta.delete(K_META_CATALOGO),
      ]);
    });
  }

  async sucursales(): Promise<SucursalLocal[]> {
    return this.db ? this.db.sucursales.toArray() : [];
  }

  async categorias(): Promise<CategoriaLocal[]> {
    return this.db ? this.db.categorias.toArray() : [];
  }

  async prendas(): Promise<PrendaLocal[]> {
    return this.db ? this.db.prendas.orderBy('nombre').toArray() : [];
  }

  async prenda(id: number): Promise<PrendaLocal | undefined> {
    return this.db?.prendas.get(id);
  }

  async variantes(): Promise<VarianteIndexada[]> {
    return this.db ? this.db.variantes.toArray() : [];
  }

  async varianteMap(): Promise<Map<number, VarianteIndexada>> {
    const lista = await this.variantes();
    return new Map(lista.map((v) => [v.id, v]));
  }

  /** Inventario de una sucursal, indexado por variante. */
  async inventarioDeSucursal(sucursalId: number): Promise<Map<number, InventarioLocal>> {
    if (!this.db) return new Map();
    const filas = await this.db.inventario.where('sucursal_id').equals(sucursalId).toArray();
    return new Map(filas.map((f) => [f.variante_id, f]));
  }

  async inventarioDeVariante(varianteId: number): Promise<InventarioLocal[]> {
    return this.db ? this.db.inventario.where('variante_id').equals(varianteId).toArray() : [];
  }

  async clientes(): Promise<ClienteLocal[]> {
    return this.db ? this.db.clientes.orderBy('nombre_completo').toArray() : [];
  }

  // ===================== Operaciones =====================

  /**
   * Guarda una operación nueva (estado LOCAL) y descuenta el stock estimado de su sucursal
   * en la misma transacción, para que las siguientes operaciones lo vean.
   */
  async agregarOperacion(op: OperacionLocal): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('IndexedDB no disponible');
    await db.transaction('rw', [db.operaciones, db.inventario], async () => {
      await db.operaciones.add(op);
      for (const it of op.datos.items) {
        const fila = await db.inventario.get([it.variante_id, op.sucursal_id]);
        if (fila) {
          await db.inventario.update([it.variante_id, op.sucursal_id], {
            stock_estimado: Math.max(0, fila.stock_estimado - it.cantidad),
          });
        }
      }
    });
  }

  /** Devuelve al stock estimado lo que descontó una operación que el servidor rechazó. */
  async devolverStockEstimado(op: OperacionLocal): Promise<void> {
    const db = this.db;
    if (!db) return;
    await db.transaction('rw', [db.inventario], async () => {
      for (const it of op.datos.items) {
        const fila = await db.inventario.get([it.variante_id, op.sucursal_id]);
        if (fila) {
          await db.inventario.update([it.variante_id, op.sucursal_id], {
            stock_estimado: Math.min(fila.stock_disponible, fila.stock_estimado + it.cantidad),
          });
        }
      }
    });
  }

  async operacion(uuid: string): Promise<OperacionLocal | undefined> {
    return this.db?.operaciones.get(uuid);
  }

  /** Todas las operaciones del usuario en su empresa, más recientes primero. */
  async operacionesDe(empresaId: string, usuarioId: number): Promise<OperacionLocal[]> {
    if (!this.db) return [];
    const lista = await this.db.operaciones.where('[empresa_id+usuario_id]').equals([empresaId, usuarioId]).toArray();
    return lista.sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  }

  /** Operaciones por enviar del usuario (LOCAL y ENVIADA), en orden de creación (§6.2). */
  async pendientesDe(empresaId: string, usuarioId: number): Promise<OperacionLocal[]> {
    if (!this.db) return [];
    const lista = await this.db.operaciones
      .where('[empresa_id+usuario_id+estado]')
      .anyOf(PENDIENTES.map((e) => [empresaId, usuarioId, e]))
      .toArray();
    return lista.sort((a, b) => a.creado_en.localeCompare(b.creado_en));
  }

  async operacionesEnEstado(empresaId: string, usuarioId: number, estado: EstadoOperacion): Promise<OperacionLocal[]> {
    if (!this.db) return [];
    return this.db.operaciones.where('[empresa_id+usuario_id+estado]').equals([empresaId, usuarioId, estado]).toArray();
  }

  async actualizarOperacion(uuid: string, cambios: Partial<OperacionLocal>): Promise<void> {
    if (!this.db) return;
    await this.db.operaciones.update(uuid, cambios);
  }

  /** Al reabrir la app, una operación que quedó ENVIADA se trata como LOCAL (§6 regla 2). */
  async reiniciarEnviadas(): Promise<number> {
    if (!this.db) return 0;
    return this.db.operaciones.where('estado').equals('ENVIADA').modify({ estado: 'LOCAL' });
  }
}

/** uuid v4. `crypto.randomUUID` existe en contexto seguro (https o localhost); si no, se arma con getRandomValues. */
export function nuevoUuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
