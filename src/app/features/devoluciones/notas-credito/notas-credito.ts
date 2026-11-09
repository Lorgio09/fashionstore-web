import { Component, OnInit, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { DevolucionesService } from '../../../core/services/devoluciones.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { NotaCredito } from '../../../core/models/devoluciones';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { fechaCorta, numero } from '../../../shared/utils/formato';
import { fechaHora } from '../../../shared/utils/fechas';

/** CU-07: notas de crédito con saldo, vencimiento, estado y movimientos. El cliente ve solo las suyas (lo filtra el servidor). */
@Component({
  selector: 'app-notas-credito',
  standalone: true,
  imports: [FormsModule, EstadoBadgeComponent],
  templateUrl: './notas-credito.html',
})
export class NotasCreditoComponent implements OnInit {
  private svc = inject(DevolucionesService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Dentro de "Mi cuenta" no se muestra el título grande. */
  incrustado = input(false);

  readonly notas = signal<NotaCredito[]>([]);
  readonly cargando = signal(true);
  readonly abierta = signal<string | null>(null);
  filtroEstado: '' | 'VIGENTE' | 'USADA' | 'VENCIDA' = '';
  buscar = '';
  readonly esPersonal = computed(() => this.auth.esPersonal());

  readonly numero = numero;
  readonly fechaCorta = fechaCorta;
  readonly fechaHora = fechaHora;

  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.svc.notas().subscribe({
      next: (l) => { this.notas.set(l); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.notif.errorHttp(e, 'No se pudieron cargar las notas de crédito.'); },
    });
  }

  get filtradas(): NotaCredito[] {
    const q = this.buscar.trim().toLowerCase();
    return this.notas().filter((n) => (!this.filtroEstado || n.estado === this.filtroEstado) &&
      (!q || n.codigo.toLowerCase().includes(q) || (n.cliente?.nombre ?? '').toLowerCase().includes(q)));
  }

  get saldoVigente(): number {
    return this.notas().filter((n) => n.estado === 'VIGENTE').reduce((s, n) => s + n.saldo, 0);
  }

  alternar(codigo: string): void {
    this.abierta.set(this.abierta() === codigo ? null : codigo);
  }

  tipoMovimiento(t: string): string {
    return t === 'EMISION' ? 'Emisión' : t === 'APLICACION' ? 'Usada en una compra' : t.charAt(0) + t.slice(1).toLowerCase();
  }
}
