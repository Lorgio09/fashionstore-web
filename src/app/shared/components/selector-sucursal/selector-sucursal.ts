import { Component, OnInit, PLATFORM_ID, inject, output, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth';
import { CatalogoOfflineService } from '../../../core/services/catalogo-offline.service';

interface Sucursal {
  id: number;
  nombre: string;
  activa?: boolean;
}

/**
 * Sucursal de trabajo. Si el usuario tiene sucursal asignada (Cajero, Encargado) queda fija;
 * si no (Administrador), elige entre las sucursales activas de SU empresa.
 * Emite el id elegido en `cambio` (también al cargar).
 */
@Component({
  selector: 'app-selector-sucursal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center gap-2 text-sm">
      <label for="sel-sucursal" class="font-medium text-gray-600">Sucursal:</label>
      @if (fija()) {
        <span id="sel-sucursal" class="font-semibold text-gray-900">{{ nombreActual() }}</span>
      } @else if (sucursales().length) {
        <select id="sel-sucursal" [ngModel]="seleccionada()" (ngModelChange)="elegir($event)"
                class="border border-gray-300 rounded px-2 py-1 bg-white focus:ring-black focus:border-black">
          @for (s of sucursales(); track s.id) {
            <option [ngValue]="s.id">{{ s.nombre }}</option>
          }
        </select>
      } @else {
        <span class="text-gray-500">{{ cargando() ? 'cargando…' : 'sin sucursales activas' }}</span>
      }
    </div>
  `,
})
export class SelectorSucursalComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private catOffline = inject(CatalogoOfflineService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  cambio = output<number>();

  sucursales = signal<Sucursal[]>([]);
  seleccionada = signal<number | null>(null);
  fija = signal(false);
  cargando = signal(true);

  ngOnInit(): void {
    if (!this.esNavegador) return;
    const asignada = this.auth.usuario()?.sucursal_id ?? null;
    if (asignada) {
      this.fija.set(true);
      // Diferido: emitir durante el ngOnInit del hijo cambiaría el estado del padre a mitad de la detección.
      queueMicrotask(() => this.elegir(asignada));
    }
    this.http.get<Sucursal[]>(`${environment.apiUrl}/catalogo/sucursales`).subscribe({
      next: (lista) => {
        this.sucursales.set(lista.filter((s) => s.activa !== false));
        this.cargando.set(false);
        if (!asignada && this.sucursales().length) this.elegir(this.sucursales()[0].id);
      },
      // Sin red: sucursales del catálogo offline guardado en el dispositivo.
      error: async () => {
        const locales = await this.catOffline.sucursales();
        this.sucursales.set(locales);
        this.cargando.set(false);
        if (!asignada && locales.length) this.elegir(locales[0].id);
      },
    });
  }

  nombreActual(): string {
    const id = this.seleccionada();
    return this.sucursales().find((s) => s.id === id)?.nombre ?? (id ? `#${id}` : '—');
  }

  elegir(id: number): void {
    this.seleccionada.set(Number(id));
    this.cambio.emit(Number(id));
  }
}
