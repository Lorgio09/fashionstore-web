import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { TiendaService } from '../services/tienda.service';

/**
 * `/tienda/:slug`: fija la tienda que se envía en `X-Empresa`.
 * Con sesión de una empresa, el backend usa la empresa del token e ignora el header: para no mostrar el catálogo
 * de una empresa con el nombre de otra, se lleva al usuario a la tienda de su propia empresa.
 */
export const tiendaGuard: CanActivateFn = (route, state) => {
  const slug = (route.paramMap.get('slug') ?? '').toLowerCase();
  const auth = inject(AuthService);
  const propia = auth.esPlataforma() ? null : auth.empresa()?.slug;
  if (propia && propia !== slug) {
    return inject(Router).parseUrl(state.url.replace(`/tienda/${route.paramMap.get('slug')}`, `/tienda/${propia}`));
  }
  inject(TiendaService).establecer(slug);
  return true;
};

/** Portada `/`: por compatibilidad, `/?tienda=<slug>` lleva directo a esa tienda. */
export const portadaGuard: CanActivateFn = (route) => {
  const slug = route.queryParamMap.get('tienda');
  return slug ? inject(Router).createUrlTree(['/tienda', slug.toLowerCase()]) : true;
};

/**
 * Rutas antiguas de la tienda (`/prenda/:id`, `/carrito`, `/checkout`) → dentro de la última tienda visitada.
 * La última tienda está en el localStorage del navegador: en el servidor (SSR) no se redirige, lo hace el navegador al hidratar.
 */
export const redirigirATienda = (resto: string): CanActivateFn => (route) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const slug = inject(TiendaService).slug();
  return inject(Router).parseUrl(`/tienda/${slug}/${resto.replace(':id', route.paramMap.get('id') ?? '')}`);
};
