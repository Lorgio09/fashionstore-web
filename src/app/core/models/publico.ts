// Cara pública de la plataforma (contrato §2.1, sin token).

export interface TiendaPublica {
  slug: string;
  nombre: string;
  sucursales: number;
  prendas: number;
  /** Máximo 6. */
  categorias: string[];
  /** Imagen de una prenda; si es null se usa la inicial. */
  portada_url: string | null;
  // Solo en GET /publico/tiendas/{slug}:
  correo?: string | null;
  telefono?: string | null;
  lista_sucursales?: { id: number; nombre: string; direccion: string | null }[];
}

export interface PlanPublico {
  codigo: string;
  nombre: string;
  precio_mensual: number;
  max_sucursales: number | null;
  /** null = sin límite. */
  max_usuarios: number | null;
  permite_offline: boolean;
  permite_reportes_ia: boolean;
}
