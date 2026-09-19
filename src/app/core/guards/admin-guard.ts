import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. SSR pasa de largo
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('token');
  
  // Extraemos la información de app.routes.ts y forzamos a que sean números reales
  const rolesBrutos = route.data['roles'];
  const rolesPermitidos = Array.isArray(rolesBrutos) ? rolesBrutos.map(Number) : null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRol = Number(payload.rol); // Blindamos el rol del token convirtiéndolo a número

      // Si el rol del usuario está dentro del arreglo permitido, pasa
      if (rolesPermitidos && rolesPermitidos.includes(userRol)) {
        return true;
      } 
      // Fallback de seguridad exclusivo para el Administrador
      else if (!rolesPermitidos && userRol === 2) {
        return true;
      } else {
        // Si te vuelve a botar, abre la consola (F12) y este mensaje te dirá exactamente el motivo.
        console.warn(`Acceso bloqueado en ${state.url}. Tu rol: ${userRol} | Permitidos:`, rolesPermitidos);
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }

  // Si no cumple nada, lo enviamos al inicio
  return router.createUrlTree(['/']);
};