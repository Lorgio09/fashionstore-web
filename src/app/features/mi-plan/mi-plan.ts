import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge';
import { BarraUsoComponent } from '../../shared/components/barra-uso/barra-uso';
import { fechaCorta } from '../../shared/utils/formato';

/** Administrador de empresa: plan contratado, vencimiento y uso frente a los límites. */
@Component({
  selector: 'app-mi-plan',
  standalone: true,
  imports: [RouterLink, EstadoBadgeComponent, BarraUsoComponent],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold text-gray-900">Mi plan</h1>
        <p class="mt-1 text-sm text-gray-500">Suscripción de {{ auth.empresa()?.razon_social }} y uso de sus límites.</p>
      </div>

      @if (auth.miEmpresa(); as m) {
        @let s = m.suscripcion;
        <section class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm text-gray-500">Plan</p>
              <p class="text-3xl font-black text-gray-900">{{ s.plan?.nombre ?? 'Sin plan' }}</p>
              @if (s.periodicidad) { <p class="text-sm text-gray-600">Facturación {{ s.periodicidad === 'ANUAL' ? 'anual' : 'mensual' }}</p> }
            </div>
            <app-estado-badge [estado]="s.estado" />
          </div>

          <dl class="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div><dt class="text-gray-500">Inicio</dt><dd class="font-semibold text-gray-900">{{ fecha(s.fecha_inicio) }}</dd></div>
            <div><dt class="text-gray-500">Vencimiento</dt><dd class="font-semibold text-gray-900">{{ fecha(s.fecha_fin) }}</dd></div>
            <div><dt class="text-gray-500">Días restantes</dt>
              <dd class="font-semibold" [class.text-gray-900]="(s.dias_restantes ?? 0) > 30" [class.text-amber-700]="(s.dias_restantes ?? 0) <= 30">
                {{ s.dias_restantes ?? '—' }}
                @if (s.dias_restantes !== null && s.dias_restantes <= 30) { <span class="text-xs">⚠ renovar pronto</span> }
              </dd>
            </div>
          </dl>

          <h2 class="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Uso del plan</h2>
          <div class="space-y-4">
            <app-barra-uso etiqueta="Sucursales activas" [usado]="s.uso.sucursales_activas" [maximo]="s.plan?.max_sucursales ?? null" />
            <app-barra-uso etiqueta="Usuarios internos" [usado]="s.uso.usuarios_internos" [maximo]="s.plan?.max_usuarios ?? null" />
          </div>
          <a routerLink="/admin/sucursales" class="mt-3 inline-block text-sm font-medium text-black underline">Gestionar sucursales</a>

          <h2 class="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Funciones incluidas</h2>
          <ul class="space-y-2 text-sm">
            <li [class.text-gray-900]="s.funciones.reportes_ia" [class.text-gray-500]="!s.funciones.reportes_ia">
              <span aria-hidden="true">{{ s.funciones.reportes_ia ? '✓' : '✕' }}</span>
              Reportes con IA y analítica {{ s.funciones.reportes_ia ? '' : '(no incluido)' }}
            </li>
            <li [class.text-gray-900]="s.funciones.offline" [class.text-gray-500]="!s.funciones.offline">
              <span aria-hidden="true">{{ s.funciones.offline ? '✓' : '✕' }}</span>
              Operación offline {{ s.funciones.offline ? '' : '(no incluido)' }}
            </li>
          </ul>
          <p class="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-500">Para cambiar de plan o renovar, contacta al administrador de la plataforma.</p>
        </section>
      } @else {
        <p class="py-10 text-center text-gray-500">Cargando plan…</p>
      }
    </div>
  `,
})
export class MiPlanComponent implements OnInit {
  auth = inject(AuthService);
  readonly fecha = fechaCorta;

  ngOnInit(): void {
    this.auth.cargarMiEmpresa(); // datos frescos al entrar
  }
}
