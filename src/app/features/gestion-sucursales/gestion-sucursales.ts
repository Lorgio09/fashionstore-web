import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService } from '../../core/services/empresa.service';
import { AuthService } from '../../core/services/auth';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SucursalEmpresa } from '../../core/models/saas';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge';
import { BarraUsoComponent } from '../../shared/components/barra-uso/barra-uso';
import { IconoComponent } from '../../shared/components/icono/icono';

/** Administrador de empresa: sucursales (activas e inactivas), alta y activar/desactivar según el plan. */
@Component({
  selector: 'app-gestion-sucursales',
  standalone: true,
  imports: [IconoComponent, FormsModule, EstadoBadgeComponent, BarraUsoComponent],
  templateUrl: './gestion-sucursales.html'
})
export class GestionSucursalesComponent implements OnInit {
  private svc = inject(EmpresaService);
  private notif = inject(NotificacionService);
  auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  sucursales = signal<SucursalEmpresa[]>([]);
  cargandoLista = signal(true);
  cargando = signal(false);
  procesando = signal<number | null>(null);
  nuevaSucursal = { nombre: '', direccion: '' };

  activas = computed(() => this.sucursales().filter((s) => s.activa).length);
  maximo = computed(() => this.auth.suscripcion()?.plan?.max_sucursales ?? null);
  enLimite = computed(() => this.maximo() !== null && this.activas() >= (this.maximo() as number));

  ngOnInit() {
    if (this.esNavegador) this.cargarSucursales();
  }

  cargarSucursales() {
    this.cargandoLista.set(true);
    this.svc.sucursales().subscribe({
      next: (data) => { this.sucursales.set(data); this.cargandoLista.set(false); },
      error: (err) => { this.cargandoLista.set(false); this.notif.errorHttp(err, 'No se pudieron cargar las sucursales.'); }
    });
  }

  guardarSucursal() {
    if (!this.nuevaSucursal.nombre.trim() || this.cargando()) return;
    this.cargando.set(true);
    this.svc.crearSucursal(this.nuevaSucursal.nombre.trim(), this.nuevaSucursal.direccion).subscribe({
      next: () => {
        this.notif.exito(`Sucursal "${this.nuevaSucursal.nombre.trim()}" creada.`);
        this.nuevaSucursal = { nombre: '', direccion: '' };
        this.cargando.set(false);
        this.cargarSucursales();
      },
      // 409: supera el límite del plan → el interceptor muestra el detail
      error: (err) => { this.cargando.set(false); this.notif.errorHttp(err, 'Error al guardar la sucursal.'); }
    });
  }

  cambiarEstado(s: SucursalEmpresa) {
    const activar = !s.activa;
    if (!activar && !confirm(`¿Desactivar "${s.nombre}"? No podrá vender ni aparecer en la tienda.`)) return;
    this.procesando.set(s.id);
    this.svc.cambiarEstadoSucursal(s.id, activar).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notif.exito(`"${s.nombre}" ${activar ? 'activada' : 'desactivada'}.`);
        this.cargarSucursales();
      },
      // 409: activar por encima del límite del plan
      error: (err) => { this.procesando.set(null); this.notif.errorHttp(err, 'No se pudo cambiar el estado.'); }
    });
  }
}
