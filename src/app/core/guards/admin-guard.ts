import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. Si estamos en el servidor (SSR), dejamos que renderice temporalmente.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // --- 2. DE AQUÍ EN ADELANTE SOLO SE EJECUTA EN EL NAVEGADOR ---
  const token = localStorage.getItem('token');
  
  // Leemos los roles permitidos que configuraste en app.routes.ts
  const rolesPermitidos = route.data['roles'] as Array<number>;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Verificamos si la ruta tiene restricciones y si el rol del usuario está incluido
      if (rolesPermitidos && rolesPermitidos.includes(payload.rol)) { 
        return true; 
      } 
      // Fallback de seguridad: si una ruta no tiene roles definidos, solo pasa el Admin (2)
      else if (!rolesPermitidos && payload.rol === 2) {
        return true;
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }

  // 3. Si está en el navegador y NO tiene el rol adecuado, lo pateamos a inicio.
  return router.createUrlTree(['/']);
};