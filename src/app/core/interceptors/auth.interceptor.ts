import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth';
import { TiendaService } from '../services/tienda.service';

/**
 * Llamadas a nuestra API:
 * - con sesión → `Authorization: Bearer <token>` (la empresa la decide el servidor);
 * - sin sesión → `X-Empresa: <slug>` para la tienda pública (contrato §2).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const token = inject(AuthService).token();
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req.clone({ setHeaders: { 'X-Empresa': inject(TiendaService).slug() } }));
};
