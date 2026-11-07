import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth';
import { FuncionesPlan, RolNombre } from '../models/sesion';

/**
 * Deja pasar si el usuario tiene uno de los roles de `data.roles` (por NOMBRE, ver ROLES).
 * Sin `data.roles` basta con estar autenticado.
 * Opcional: `data.funcion` ('reportes_ia' | 'offline') exige que el plan la incluya.
 */
export const rolGuard: CanActivateFn = (route) => {
  // En el servidor (SSR) no hay sesión: se decide en el navegador.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) return router.createUrlTree(['/login']);

  const roles = route.data['roles'] as RolNombre[] | undefined;
  if (roles?.length && !auth.tieneRol(...roles)) {
    return router.createUrlTree([auth.rutaInicio()]);
  }

  const funcion = route.data['funcion'] as keyof FuncionesPlan | undefined;
  // Si mi-empresa aún no cargó se deja pasar: el backend responde 403 y se muestra el detail.
  if (funcion && auth.miEmpresa() && !auth.tieneFuncion(funcion)) {
    return router.createUrlTree([auth.rutaInicio()]);
  }
  return true;
};

/**
 * Para `/admin` vacío: manda a cada rol a su pantalla de inicio.
 * Es un guard (no `redirectTo`) porque en SSR no hay sesión y el servidor redirigiría a "/".
 */
export const inicioPorRolGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const auth = inject(AuthService);
  return inject(Router).parseUrl(auth.rutaInicio());
};

/** @deprecated usar rolGuard */
export const adminGuard = rolGuard;
