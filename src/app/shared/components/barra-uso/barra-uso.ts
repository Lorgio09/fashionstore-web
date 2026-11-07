import { Component, computed, input } from '@angular/core';

/** Uso frente al límite del plan: "3 de 10". Sin límite (null) muestra "ilimitado". */
@Component({
  selector: 'app-barra-uso',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div>
      <div class="flex items-baseline justify-between text-sm">
        <span class="font-medium text-gray-700">{{ etiqueta() }}</span>
        <span class="text-gray-900">
          <strong>{{ usado() }}</strong> {{ maximo() === null ? '(ilimitado)' : 'de ' + maximo() }}
          @if (lleno()) { <span class="ml-1 text-xs font-semibold text-amber-700">⚠ límite alcanzado</span> }
        </span>
      </div>
      @if (maximo() !== null) {
        <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar"
             [attr.aria-valuenow]="usado()" aria-valuemin="0" [attr.aria-valuemax]="maximo()" [attr.aria-label]="etiqueta()">
          <div class="h-full rounded-full" [class.bg-black]="!lleno()" [class.bg-amber-500]="lleno()" [style.width.%]="porcentaje()"></div>
        </div>
      }
    </div>
  `,
})
export class BarraUsoComponent {
  etiqueta = input.required<string>();
  usado = input.required<number>();
  maximo = input<number | null>(null);

  porcentaje = computed(() => {
    const m = this.maximo();
    return m ? Math.min(100, Math.round((this.usado() / m) * 100)) : 0;
  });
  lleno = computed(() => {
    const m = this.maximo();
    return m !== null && this.usado() >= m;
  });
}
