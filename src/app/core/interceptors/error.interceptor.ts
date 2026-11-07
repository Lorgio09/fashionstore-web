import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth';
import { NotificacionService } from '../services/notificacion.service';

/**
 * Errores del backend (contrato §5):
 * - 401 con sesión → la sesión venció: se cierra y se vuelve al login;
 * - 403, 409 y 422 → se muestra el `detail` en español.
 * El login maneja sus propios errores (401/403) en su pantalla.
 * El error se re-lanza igual, para que cada pantalla libere sus botones/estados.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notif = inject(NotificacionService);
  const esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  const esLogin = req.url.startsWith(`${environment.apiUrl}/usuarios/login`);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!esNavegador || esLogin || !(err instanceof HttpErrorResponse)) return throwError(() => err);
      if (!req.url.startsWith(environment.apiUrl)) return throwError(() => err);

      if (err.status === 401 && auth.autenticado()) {
        notif.marcarMostrado(err);
        notif.aviso('Tu sesión venció. Vuelve a iniciar sesión.', 'Sesión cerrada');
        auth.cerrarSesion();
      } else if (err.status === 403 || err.status === 409 || err.status === 422) {
        notif.marcarMostrado(err);
        const titulo =
          err.status === 403 ? 'Acceso no permitido' : err.status === 409 ? 'No se puede realizar' : 'Datos inválidos';
        notif.error(NotificacionService.detalle(err) ?? 'La operación fue rechazada.', titulo);
      }
      return throwError(() => err);
    }),
  );
};
