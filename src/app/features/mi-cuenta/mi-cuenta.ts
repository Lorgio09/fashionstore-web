import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DevolucionesService } from '../../core/services/devoluciones.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Solicitud, VentaDevolucion } from '../../core/models/devoluciones';
import { FormularioSolicitudComponent } from '../devoluciones/formulario-solicitud/formulario-solicitud';
import { NotasCreditoComponent } from '../devoluciones/notas-credito/notas-credito';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge';
import { fechaCorta, numero } from '../../shared/utils/formato';
import { fechaHora } from '../../shared/utils/fechas';

type Pestana = 'compras' | 'solicitudes' | 'notas';

/** Cliente: "Mis compras" → solicitar devolución; "Mis solicitudes"; "Mis notas de crédito". */
@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [CommonModule, RouterLink, FormularioSolicitudComponent, NotasCreditoComponent, EstadoBadgeComponent],
  templateUrl: './mi-cuenta.html',
})
export class MiCuentaComponent implements OnInit {
  private svc = inject(DevolucionesService);
  private notif = inject(NotificacionService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly pestana = signal<Pestana>('compras');
  readonly compras = signal<VentaDevolucion[] | null>(null);
  readonly solicitudes = signal<Solicitud[] | null>(null);
  readonly devolviendo = signal<number | null>(null);

  readonly numero = numero;
  readonly fechaCorta = fechaCorta;
  readonly fechaHora = fechaHora;

  ngOnInit(): void {
    if (!this.esNavegador) return;
    const p = this.ruta.snapshot.queryParamMap.get('ver') as Pestana | null;
    this.ir(p && ['compras', 'solicitudes', 'notas'].includes(p) ? p : 'compras');
  }

  ir(p: Pestana): void {
    this.pestana.set(p);
    this.router.navigate([], { queryParams: { ver: p === 'compras' ? null : p }, replaceUrl: true });
    if (p === 'compras' && !this.compras()) this.cargarCompras();
    if (p === 'solicitudes') this.cargarSolicitudes();
  }

  private cargarCompras(): void {
    this.svc.misCompras().subscribe({
      next: (l) => this.compras.set(l),
      error: (e) => { this.compras.set([]); this.notif.errorHttp(e, 'No se pudieron cargar tus compras.'); },
    });
  }

  private cargarSolicitudes(): void {
    this.svc.historial().subscribe({
      next: (h) => this.solicitudes.set(h.solicitudes),
      error: (e) => { this.solicitudes.set([]); this.notif.errorHttp(e, 'No se pudieron cargar tus solicitudes.'); },
    });
  }

  elegibles(v: VentaDevolucion): number {
    return v.items.reduce((s, i) => s + i.elegible, 0);
  }

  creada(s: Solicitud): void {
    this.devolviendo.set(null);
    this.compras.set(null); // las cantidades elegibles cambiaron
    this.router.navigate(['/mi-cuenta/solicitudes', s.codigo]);
  }
}
