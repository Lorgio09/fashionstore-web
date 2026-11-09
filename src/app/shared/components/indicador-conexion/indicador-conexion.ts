import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConexionService } from '../../../core/services/conexion.service';
import { AuthService } from '../../../core/services/auth';
import { OperacionesOfflineService } from '../../../core/services/operaciones-offline.service';
import { SincronizacionService } from '../../../core/sync/sincronizacion.service';

/** Indicador online/offline siempre visible, con las operaciones pendientes y en conflicto del usuario. */
@Component({
  selector: 'app-indicador-conexion',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="fixed bottom-3 left-1/2 -translate-x-1/2 z-[80] whitespace-nowrap flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-md"
         [class.bg-white]="conexion.enLinea()" [class.border-gray-200]="conexion.enLinea()" [class.text-gray-800]="conexion.enLinea()"
         [class.bg-gray-900]="!conexion.enLinea()" [class.border-gray-900]="!conexion.enLinea()" [class.text-white]="!conexion.enLinea()"
         role="status" aria-live="polite">
      <span class="h-2.5 w-2.5 rounded-full" [class.bg-green-500]="conexion.enLinea()" [class.bg-red-500]="!conexion.enLinea()" aria-hidden="true"></span>
      <span>{{ conexion.enLinea() ? 'En línea' : 'Sin conexión' }}</span>
      @if (sync.sincronizando()) {
        <span class="font-normal">· <span aria-hidden="true">↻</span> sincronizando…</span>
      }
      @if (auth.autenticado()) {
        @if (ops.pendientes() > 0) {
          <a [routerLink]="ruta()" class="font-normal underline">· ◷ {{ ops.pendientes() }} pendiente{{ ops.pendientes() === 1 ? '' : 's' }}</a>
        }
        @if (ops.conflictos() > 0) {
          <a [routerLink]="ruta()" class="font-normal underline">· ⚠ {{ ops.conflictos() }} en conflicto</a>
        }
      }
    </div>
  `,
})
export class IndicadorConexionComponent {
  conexion = inject(ConexionService);
  auth = inject(AuthService);
  ops = inject(OperacionesOfflineService);
  sync = inject(SincronizacionService);

  ruta = computed(() => (this.auth.esPersonal() ? '/admin/sincronizacion' : '/sincronizacion'));
}
