import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. Si estamos en el servidor (SSR), dejamos que renderice temporalmente.
  // El servidor NO puede leer localStorage, así que lo dejamos pasar.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // --- 2. DE AQUÍ EN ADELANTE SOLO SE EJECUTA EN EL NAVEGADOR ---
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Si es admin, lo dejamos quedarse en la página
      if (payload.rol === 'admin' || payload.rol === 'administrador') {
        return true; 
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }

  // 3. Si está en el navegador y NO tiene token de admin, lo pateamos a inicio.
  // createUrlTree es la forma segura de redirigir sin romper el servidor.
  return router.createUrlTree(['/']);
};