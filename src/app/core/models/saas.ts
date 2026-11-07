// Modelos SaaS (contrato §4).
import { Suscripcion } from './sesion';

export type Periodicidad = 'MENSUAL' | 'ANUAL';
export type EstadoEmpresa = 'ACTIVA' | 'SUSPENDIDA';

export interface Plan {
  id: number;
  codigo: string;
  nombre: string;
  precio_mensual: number;
  max_sucursales: number | null;
  max_usuarios: number | null;
  permite_offline: boolean;
  permite_reportes_ia: boolean;
  activo: boolean;
}

export type PlanForm = Omit<Plan, 'id'>;

export interface Empresa {
  id: string;
  razon_social: string;
  nit: string;
  slug: string;
  correo: string | null;
  telefono: string | null;
  estado: EstadoEmpresa;
  fecha_registro: string;
}

/** `GET /plataforma/empresas`: empresa + resumen de suscripción (mismo formato que mi-empresa). */
export interface EmpresaConSuscripcion extends Empresa {
  suscripcion: Suscripcion;
}

export interface EmpresaNueva {
  razon_social: string;
  nit: string;
  slug: string;
  correo?: string | null;
  telefono?: string | null;
  plan_codigo: string;
  periodicidad: Periodicidad;
  admin_nombre: string;
  admin_email: string;
  admin_password: string;
}

/** Fila del historial `GET /plataforma/empresas/{id}/suscripciones`. */
export interface SuscripcionHistorial {
  id: number;
  empresa_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  periodicidad: Periodicidad;
  plan: Plan;
}

export interface CambioPlan {
  plan_codigo: string;
  periodicidad: Periodicidad;
  fecha_inicio?: string | null;
}

export interface SucursalEmpresa {
  id: number;
  nombre: string;
  direccion: string | null;
  activa: boolean;
}
