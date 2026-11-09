import { Component, inject, input } from '@angular/core';
import { CatalogoOfflineService } from '../../../core/services/catalogo-offline.service';
import { fechaHora, haceCuanto } from '../../utils/fechas';
import { IconoComponent } from '../../../shared/components/icono/icono';

/** "Datos al <fecha>" del catálogo local, con aviso de desactualizado (§6.1). */
@Component({
  selector: 'app-aviso-datos-offline',
  standalone: true,
  imports: [IconoComponent],
  template: `
    @if (cat.meta(); as m) {
      <div role="status" class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded border px-3 py-2 text-sm"
           [class.border-amber-300]="cat.desactualizado()" [class.bg-amber-50]="cat.desactualizado()" [class.text-amber-900]="cat.desactualizado()"
           [class.border-gray-200]="!cat.desactualizado()" [class.bg-gray-50]="!cat.desactualizado()" [class.text-gray-700]="!cat.desactualizado()">
        <app-icono [nombre]="cat.desactualizado() ? 'alerta' : 'info'" clase="mt-0.5 h-4 w-4" />
        <span><strong>{{ titulo() }}</strong> Datos al {{ fecha(m.generado_en) }} ({{ hace(m.generado_en) }}).</span>
        @if (cat.vencido()) {
          <span class="font-semibold">Desactualizado: pasaron más de {{ m.vigencia_horas }} h.</span>
        } @else if (cat.desactualizado()) {
          <span class="font-semibold">Puede estar desactualizado: estás sin conexión.</span>
        }
        @if (stockEstimado()) {
          <span>El stock es <strong>estimado</strong>.</span>
        }
      </div>
    }
  `,
})
export class AvisoDatosOfflineComponent {
  cat = inject(CatalogoOfflineService);
  titulo = input('Catálogo sin conexión.');
  stockEstimado = input(false);
  readonly fecha = fechaHora;
  readonly hace = haceCuanto;
}
