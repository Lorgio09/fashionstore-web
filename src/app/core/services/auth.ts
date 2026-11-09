import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EmpresaSesion,
  FuncionesPlan,
  LoginRespuesta,
  MiEmpresa,
  ROLES,
  ROLES_PERSONAL,
  RolNombre,
  UsuarioSesion,
} from '../models/sesion';
import { TiendaService } from './tienda.service';

const K_TOKEN = 'token';
const K_USUARIO = 'usuario';
const K_EMPRESA = 'empresa';
const K_MI_EMPRESA = 'mi_empresa';

/**
 * Sesión multitenant (capa de negocio): token, usuario y empresa que devuelve el login,
 * más el plan/funciones de `GET /empresa/mi-empresa`.
 * Los permisos se deciden por `rol_nombre`, nunca por `rol_id` (contrato §2).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tienda = inject(TiendaService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _token = signal<string | null>(null);
  private readonly _usuario = signal<UsuarioSesion | null>(null);
  private readonly _empresa = signal<EmpresaSesion | null>(null);
  private readonly _miEmpresa = signal<MiEmpresa | null>(null);

  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly empresa = this._empresa.asReadonly();
  readonly miEmpresa = this._miEmpresa.asReadonly();

  readonly autenticado = computed(() => !!this._token() && !!this._usuario());
  readonly rol = computed<RolNombre | null>(() => this._usuario()?.rol_nombre ?? null);
  readonly esPersonal = computed(() => {
    const r = this.rol();
    return !!r && ROLES_PERSONAL.includes(r);
  });
  readonly esPlataforma = computed(() => this.rol() === ROLES.PLATAFORMA);
  readonly suscripcion = computed(() => this._miEmpresa()?.suscripcion ?? null);
  /** Funciones del plan. Mientras no se cargue mi-empresa se asume todo apagado. */
  readonly funciones = computed<FuncionesPlan>(
    () => this._miEmpresa()?.suscripcion?.funciones ?? { reportes_ia: false, offline: false },
  );

  constructor() {
    this.restaurar();
  }

  // ---------- Login / logout ----------

  login(email: string, password: string): Observable<LoginRespuesta> {
    return this.http
      .post<LoginRespuesta>(`${environment.apiUrl}/usuarios/login`, { email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  guardarSesion(r: LoginRespuesta): void {
    this._token.set(r.access_token);
    this._usuario.set(r.usuario);
    this._empresa.set(r.empresa);
    this._miEmpresa.set(null);
    this.escribir(K_TOKEN, r.access_token);
    this.escribir(K_USUARIO, JSON.stringify(r.usuario));
    this.escribir(K_EMPRESA, r.empresa ? JSON.stringify(r.empresa) : null);
    this.escribir(K_MI_EMPRESA, null);
    // Al salir, el visitante sigue en la tienda de su empresa.
    if (r.empresa) this.tienda.establecer(r.empresa.slug);
    this.cargarMiEmpresa();
  }

  cerrarSesion(irAlLogin = true): void {
    this._token.set(null);
    this._usuario.set(null);
    this._empresa.set(null);
    this._miEmpresa.set(null);
    [K_TOKEN, K_USUARIO, K_EMPRESA, K_MI_EMPRESA].forEach((k) => this.escribir(k, null));
    if (irAlLogin) this.router.navigate(['/login']);
  }

  /** Recarga plan, uso y funciones de la empresa. No aplica al administrador de plataforma. */
  cargarMiEmpresa(): void {
    if (!this.esNavegador || !this.autenticado() || !this._empresa()) return;
    this.http.get<MiEmpresa>(`${environment.apiUrl}/empresa/mi-empresa`).subscribe({
      next: (m) => {
        this._miEmpresa.set(m);
        this.escribir(K_MI_EMPRESA, JSON.stringify(m)); // copia para arrancar sin red
      },
      error: () => {
        /* el interceptor ya mostró el detail; se mantiene la copia local */
      },
    });
  }

  // ---------- Permisos ----------

  tieneRol(...roles: RolNombre[]): boolean {
    const r = this.rol();
    return !!r && roles.includes(r);
  }

  tieneFuncion(f: keyof FuncionesPlan): boolean {
    return this.funciones()[f] === true;
  }

  /** Pantalla de inicio según el rol. */
  rutaInicio(): string {
    switch (this.rol()) {
      case ROLES.ADMIN:
        return '/admin/dashboard';
      case ROLES.ENCARGADO:
        return '/admin/entrada-inventario';
      case ROLES.CAJERO:
        return '/admin/punto-venta';
      case ROLES.PLATAFORMA:
        return '/plataforma/empresas';
      default: {
        // Cliente: vuelve a la tienda de su empresa (§2.1).
        const slug = this.empresa()?.slug;
        return slug ? `/tienda/${slug}` : '/';
      }
    }
  }

  /** Compatibilidad con código anterior: datos básicos del usuario o null. */
  getUsuarioActual(): UsuarioSesion | null {
    return this._usuario();
  }

  // ---------- Persistencia (solo navegador) ----------

  private restaurar(): void {
    if (!this.esNavegador) return;
    const token = this.leer(K_TOKEN);
    if (!token) return;

    const payload = this.decodificar(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      this.cerrarSesion(false);
      return;
    }

    let usuario = this.leerJson<UsuarioSesion>(K_USUARIO);
    if (!usuario) {
      // Sesión iniciada con la versión anterior (solo token): se reconstruye desde el JWT.
      usuario = {
        id: payload.id,
        nombre: payload.nombre,
        email: payload.sub,
        rol_id: payload.rol,
        rol_nombre: payload.rol_nombre,
        sucursal_id: payload.sucursal_id ?? null,
      };
    }
    if (!usuario?.rol_nombre) {
      this.cerrarSesion(false);
      return;
    }

    this._token.set(token);
    this._usuario.set(usuario);
    this._empresa.set(this.leerJson<EmpresaSesion>(K_EMPRESA));
    this._miEmpresa.set(this.leerJson<MiEmpresa>(K_MI_EMPRESA));
    // Diferido: los interceptores inyectan AuthService y aún se está construyendo (evita NG0200).
    setTimeout(() => this.cargarMiEmpresa());
  }

  private decodificar(token: string): any | null {
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(b64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(''),
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private leer(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }

  private leerJson<T>(k: string): T | null {
    const v = this.leer(k);
    if (!v) return null;
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }

  private escribir(k: string, v: string | null): void {
    if (!this.esNavegador) return;
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* almacenamiento bloqueado */
    }
  }
}
