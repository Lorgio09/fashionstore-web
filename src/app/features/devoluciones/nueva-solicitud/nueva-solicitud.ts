import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DevolucionesService } from '../../../core/services/devoluciones.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Solicitud, VentaDevolucion } from '../../../core/models/devoluciones';
import { FormularioSolicitudComponent } from '../formulario-solicitud/formulario-solicitud';
import { numero } from '../../../shared/utils/formato';
import { fechaHora } from '../../../shared/utils/fechas';

/** CU-01: el personal busca la venta (comprobante o cliente) y registra la solicitud. */
@Component({
  selector: 'app-nueva-solicitud',
  standalone: true,
  imports: [FormsModule, RouterLink, FormularioSolicitudComponent],
  templateUrl: './nueva-solicitud.html',
})
export class NuevaSolicitudComponent {
  private svc = inject(DevolucionesService);
  private notif = inject(NotificacionService);
  private router = inject(Router);

  criterio = '';
  readonly buscando = signal(false);
  readonly resultados = signal<VentaDevolucion[] | null>(null);
  readonly elegida = signal<VentaDevolucion | null>(null);
  readonly numero = numero;
  readonly fechaHora = fechaHora;

  buscar(): void {
    const q = this.criterio.trim().replace(/^#/, '');
    if (!q) return;
    const esNumero = /^\d+$/.test(q);
    if (!esNumero && q.length < 2) return;
    this.buscando.set(true);
    this.elegida.set(null);
    this.svc.buscarVentas(esNumero ? { orden_id: Number(q) } : { cliente: q }).subscribe({
      next: (l) => {
        this.buscando.set(false);
        this.resultados.set(l);
        if (l.length === 1) this.elegida.set(l[0]);
      },
      error: (e) => { this.buscando.set(false); this.notif.errorHttp(e, 'No se pudo buscar la venta.'); },
    });
  }

  elegibles(v: VentaDevolucion): number {
    return v.items.reduce((s, i) => s + i.elegible, 0);
  }

  creada(s: Solicitud): void {
    this.router.navigate(['/admin/devoluciones', s.codigo]);
  }
}
