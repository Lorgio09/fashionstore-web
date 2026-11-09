import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { KeyValuePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ROLES } from '../../../core/models/sesion';
import { DevolucionesService } from '../../../core/services/devoluciones.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ESTADOS_SOLICITUD, FiltrosSolicitudes, HistorialSolicitudes, MOTIVOS } from '../../../core/models/devoluciones';
import { SucursalEmpresa } from '../../../core/models/saas';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { numero } from '../../../shared/utils/formato';
import { fechaHora } from '../../../shared/utils/fechas';
import { IconoComponent } from '../../../shared/components/icono/icono';

/** CU-11: historial de solicitudes con filtros e indicadores. Cajero y Encargado ven solo su sucursal. */
@Component({
  selector: 'app-historial-devoluciones',
  standalone: true,
  imports: [IconoComponent, FormsModule, RouterLink, KeyValuePipe, EstadoBadgeComponent],
  templateUrl: './historial-devoluciones.html',
})
export class HistorialDevolucionesComponent implements OnInit {
  private svc = inject(DevolucionesService);
  private empresa = inject(EmpresaService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  filtros: FiltrosSolicitudes = { estado: null, sucursal_id: null, motivo: null, desde: null, hasta: null };
  readonly datos = signal<HistorialSolicitudes | null>(null);
  readonly cargando = signal(false);
  readonly sucursales = signal<SucursalEmpresa[]>([]);
  readonly esAdmin = computed(() => this.auth.tieneRol(ROLES.ADMIN));

  readonly estados = ESTADOS_SOLICITUD;
  readonly motivos = MOTIVOS;
  readonly numero = numero;
  readonly fechaHora = fechaHora;

  ngOnInit(): void {
    if (!this.esNavegador) return;
    if (this.esAdmin()) this.empresa.sucursales().subscribe({ next: (l) => this.sucursales.set(l) });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.historial(this.filtros).subscribe({
      next: (d) => { this.datos.set(d); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.notif.errorHttp(e, 'No se pudo cargar el historial.'); },
    });
  }

  limpiar(): void {
    this.filtros = { estado: null, sucursal_id: null, motivo: null, desde: null, hasta: null };
    this.cargar();
  }

  nombreEstado(e: string): string {
    return this.estados.find((x) => x.valor === e)?.nombre ?? e;
  }

  canal(c: string): string {
    return c === 'OFFLINE' ? 'Sin conexión' : c === 'EN_LINEA' || c === 'WEB' ? 'En línea' : c === 'TIENDA' ? 'Tienda' : c;
  }
}
