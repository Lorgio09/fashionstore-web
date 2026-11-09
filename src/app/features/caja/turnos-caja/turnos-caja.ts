import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ROLES } from '../../../core/models/sesion';
import { CajaService } from '../../../core/services/caja.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { TurnoCaja } from '../../../core/models/caja';
import { SucursalEmpresa } from '../../../core/models/saas';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { numero } from '../../../shared/utils/formato';
import { fechaHora } from '../../../shared/utils/fechas';

/** Historial de turnos de caja (CU-20). Encargado y Administrador autorizan los cierres con diferencia sobre el umbral. */
@Component({
  selector: 'app-turnos-caja',
  standalone: true,
  imports: [FormsModule, EstadoBadgeComponent],
  templateUrl: './turnos-caja.html',
})
export class TurnosCajaComponent implements OnInit {
  private svc = inject(CajaService);
  private empresa = inject(EmpresaService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly turnos = signal<TurnoCaja[]>([]);
  readonly cargando = signal(true);
  readonly autorizando = signal<number | null>(null);
  readonly sucursales = signal<SucursalEmpresa[]>([]);
  readonly abierto = signal<number | null>(null);
  sucursalId: number | null = null;

  readonly esAdmin = computed(() => this.auth.tieneRol(ROLES.ADMIN));
  readonly puedeAutorizar = computed(() => this.auth.tieneRol(ROLES.ADMIN, ROLES.ENCARGADO));
  readonly pendientes = computed(() => this.turnos().filter((t) => t.estado === 'PENDIENTE_AUTORIZACION').length);
  readonly numero = numero;
  readonly fechaHora = fechaHora;

  ngOnInit(): void {
    if (!this.esNavegador) return;
    if (this.esAdmin()) this.empresa.sucursales().subscribe({ next: (l) => this.sucursales.set(l) });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.turnos(this.sucursalId).subscribe({
      next: (l) => { this.turnos.set(l); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.notif.errorHttp(e, 'No se pudo cargar el historial de caja.'); },
    });
  }

  autorizar(t: TurnoCaja): void {
    this.autorizando.set(t.id);
    this.svc.autorizar(t.id).subscribe({
      next: (r) => {
        this.autorizando.set(null);
        this.turnos.update((l) => l.map((x) => (x.id === r.id ? r : x)));
        this.notif.exito(`Cierre de caja autorizado (diferencia Bs ${numero(r.diferencia)}).`);
      },
      error: (e) => { this.autorizando.set(null); this.notif.errorHttp(e, 'No se pudo autorizar el cierre.'); },
    });
  }

  alternar(id: number): void {
    this.abierto.set(this.abierto() === id ? null : id);
  }
}
