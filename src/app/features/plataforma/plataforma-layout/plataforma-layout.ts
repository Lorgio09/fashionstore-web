import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

/** Panel del administrador de plataforma (SaaS): empresas, suscripciones y planes. */
@Component({
  selector: 'app-plataforma-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex min-h-screen w-full flex-col bg-gray-50 md:h-screen md:flex-row">
      <aside class="flex w-full flex-col bg-black text-white md:h-full md:w-64">
        <div class="border-b border-gray-800 px-6 py-4">
          <span class="text-lg font-bold">FashionStore</span>
          <p class="mt-1 text-sm text-gray-300">Plataforma SaaS</p>
        </div>
        <nav class="flex-1 py-4">
          <ul class="flex gap-1 px-2 md:block md:space-y-0.5">
            <li>
              <a routerLink="/plataforma/empresas" routerLinkActive="!bg-white !text-black"
                 class="block rounded px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-900 hover:text-white">
                Empresas y suscripciones
              </a>
            </li>
            <li>
              <a routerLink="/plataforma/planes" routerLinkActive="!bg-white !text-black"
                 class="block rounded px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-900 hover:text-white">
                Planes
              </a>
            </li>
          </ul>
        </nav>
        <div class="border-t border-gray-800 px-6 py-4">
          <p class="truncate text-sm font-medium">{{ auth.usuario()?.nombre }}</p>
          <p class="text-xs text-gray-400">{{ auth.rol() }}</p>
          <button type="button" (click)="auth.cerrarSesion()" class="mt-3 text-sm text-gray-300 underline hover:text-white">Cerrar sesión</button>
        </div>
      </aside>
      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PlataformaLayoutComponent {
  auth = inject(AuthService);
}
