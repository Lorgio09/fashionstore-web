import Dexie, { Table } from 'dexie';
import {
  CategoriaLocal,
  ClienteLocal,
  InventarioLocal,
  OperacionLocal,
  PrendaLocal,
  SucursalLocal,
  VarianteIndexada,
} from '../models/offline';

export interface FilaMeta {
  clave: string;
  valor: unknown;
}

/**
 * Base IndexedDB de la PWA (Dexie). Solo se instancia en el navegador.
 * - Catálogo offline (§6.1): se reemplaza completo cada vez que se "prepara" el dispositivo.
 * - Operaciones (§6.2): nunca se borran por haberse enviado (RN18); quedan como historial.
 */
export class FashionStoreDB extends Dexie {
  meta!: Table<FilaMeta, string>;
  sucursales!: Table<SucursalLocal, number>;
  categorias!: Table<CategoriaLocal, number>;
  prendas!: Table<PrendaLocal, number>;
  variantes!: Table<VarianteIndexada, number>;
  inventario!: Table<InventarioLocal, [number, number]>;
  clientes!: Table<ClienteLocal, number>;
  operaciones!: Table<OperacionLocal, string>;

  constructor() {
    super('fashionstore');
    this.version(1).stores({
      meta: 'clave',
      sucursales: 'id',
      categorias: 'id',
      prendas: 'id, categoria_id, nombre',
      variantes: 'id, prenda_id, codigo_sku',
      inventario: '[variante_id+sucursal_id], variante_id, sucursal_id',
      clientes: 'id, nombre_completo',
      operaciones: 'uuid, estado, tipo, creado_en, [empresa_id+usuario_id], [empresa_id+usuario_id+estado]',
    });
  }
}
