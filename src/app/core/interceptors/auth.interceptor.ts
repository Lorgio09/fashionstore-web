import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // 1. Verificamos que estemos en el navegador (para que SSR no falle)
  if (isPlatformBrowser(platformId)) {
    // 2. Buscamos la llave maestra que guardaste en el login
    const token = localStorage.getItem('token');

    // 3. Si existe el token, clonamos la petición y se lo pegamos en la cabecera
    if (token) {
      const peticionAutorizada = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      // Dejamos que la petición continúe su viaje hacia FastAPI
      return next(peticionAutorizada);
    }
  }

  // Si no hay token (ej. el usuario apenas se va a loguear), la dejamos pasar normal
  return next(req);
};