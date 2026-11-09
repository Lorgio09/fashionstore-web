import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { IconoComponent } from '../../../shared/components/icono/icono';

/** Avisos flotantes (errores 403/409/422 del backend, éxitos, avisos). Ícono + texto, no solo color. */
@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [IconoComponent],
  template: `
    <div class="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96" aria-live="assertive">
      @for (n of notif.items(); track n.id) {
        <div role="alert"
             class="flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg"
             [class.border-red-300]="n.tipo === 'error'"
             [class.border-green-300]="n.tipo === 'exito'"
             [class.border-amber-300]="n.tipo === 'aviso'">
          <span class="mt-0.5"
                [class.text-red-600]="n.tipo === 'error'"
                [class.text-green-600]="n.tipo === 'exito'"
                [class.text-amber-600]="n.tipo === 'aviso'">
            <app-icono [nombre]="n.tipo === 'error' ? 'cerrar' : n.tipo === 'exito' ? 'ok' : 'alerta'" clase="h-5 w-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900">{{ n.titulo }}</p>
            <p class="mt-0.5 break-words text-sm text-gray-700">{{ n.mensaje }}</p>
          </div>
          <button type="button" (click)="notif.cerrar(n.id)" class="text-gray-400 hover:text-gray-700" aria-label="Cerrar aviso"><app-icono nombre="cerrar" clase="h-4 w-4" /></button>
        </div>
      }
    </div>
  `,
})
export class NotificacionesComponent {
  notif = inject(NotificacionService);
}
