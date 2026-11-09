import { Component, inject } from '@angular/core';
import { TiendaService } from '../../core/services/tienda.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth';

/** Marco del área del cliente: compras, devoluciones y notas de crédito. */
@Component({
  selector: 'app-mi-cuenta-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="border-b border-gray-200 bg-white">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <a [routerLink]="tienda.ruta()" class="text-xl font-black tracking-tight text-black">{{ tienda.nombre() }}</a>
          <div class="flex items-center gap-4 text-sm">
            <span class="text-gray-700">Hola, <strong>{{ auth.usuario()?.nombre }}</strong></span>
            <a [routerLink]="tienda.ruta()" class="font-medium text-gray-600 hover:text-black">Volver a la tienda</a>
            <button type="button" (click)="salir()" class="font-medium text-red-600 hover:text-red-800">Cerrar sesión</button>
          </div>
        </div>
      </nav>
      <main class="mx-auto max-w-6xl px-4 py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class MiCuentaLayoutComponent {
  /** Tienda actual: nombre y enlaces relativos a /tienda/:slug. */
  tienda = inject(TiendaService);
  auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // El cliente pertenece a una empresa: su tienda es la de su empresa.
    const slug = this.auth.empresa()?.slug;
    if (slug) this.tienda.establecer(slug);
    else this.tienda.asegurar();
  }

  salir(): void {
    const ruta = this.tienda.ruta();
    this.auth.cerrarSesion();
    this.router.navigateByUrl(ruta);
  }
}
