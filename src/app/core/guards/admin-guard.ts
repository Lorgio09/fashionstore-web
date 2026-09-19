import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) return true;

  const token = localStorage.getItem('token');
  const rolesBrutos = route.data['roles'];
  const rolesPermitidos = Array.isArray(rolesBrutos) ? rolesBrutos.map(Number) : null;

  // RASTREADOR 1: Ver qué ruta estamos intentando abrir
  console.log(`[Guard] Intentando entrar a: ${state.url}`);

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRol = Number(payload.rol);

      // RASTREADOR 2: Confirmar las llaves que tiene el usuario vs las que pide la puerta
      console.log(`[Guard] Tu Rol: ${userRol} | Roles que pueden entrar:`, rolesPermitidos);

      if (rolesPermitidos && rolesPermitidos.includes(userRol)) {
        console.log(`[Guard] ¡Acceso APROBADO para ${state.url}!`);
        return true; // <--- Si ves este mensaje en consola y te bota, el culpable 100% era el FormsModule.
      } 
      else if (!rolesPermitidos && userRol === 2) {
        return true;
      } else {
        console.warn(`[Guard] Acceso DENEGADO para ${state.url}`);
        return router.createUrlTree(['/']);
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }

  return router.createUrlTree(['/']);
};