// Modelos de sesión multitenant (contrato §2).

/** Nombres exactos de rol. Los permisos se deciden por nombre: los rol_id cambian entre bases. */
export const ROLES = {
  CLIENTE: 'Cliente',
  ADMIN: 'Administrador',
  ENCARGADO: 'Encargado de sucursal',
  CAJERO: 'Cajero',
  PLATAFORMA: 'Administrador de plataforma',
} as const;

export type RolNombre = (typeof ROLES)[keyof typeof ROLES];

/** Roles del personal de una empresa (entran al panel /admin). */
export const ROLES_PERSONAL: RolNombre[] = [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO];

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email?: string;
  rol_id: number;
  rol_nombre: RolNombre;
  sucursal_id: number | null;
}

export interface EmpresaSesion {
  id: string;
  razon_social: string;
  slug: string;
}

export interface LoginRespuesta {
  access_token: string;
  token_type: string;
  usuario: UsuarioSesion;
  empresa: EmpresaSesion | null; // null para el administrador de plataforma
}

export interface FuncionesPlan {
  reportes_ia: boolean;
  offline: boolean;
}

export type EstadoSuscripcion = 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA' | 'PROGRAMADA' | 'SIN_SUSCRIPCION';

export interface Suscripcion {
  estado: EstadoSuscripcion;
  suscripcion_id?: number;
  plan: {
    id: number;
    codigo: string;
    nombre: string;
    max_sucursales: number | null;
    max_usuarios: number | null;
  } | null;
  periodicidad: 'MENSUAL' | 'ANUAL' | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias_restantes: number | null;
  uso: { sucursales_activas: number; usuarios_internos: number };
  funciones: FuncionesPlan;
}

export interface MiEmpresa {
  empresa: EmpresaSesion & {
    nit: string;
    correo: string | null;
    telefono: string | null;
    estado: string;
    fecha_registro: string;
  };
  suscripcion: Suscripcion;
}
