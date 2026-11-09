import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { TiendaService } from '../../../core/services/tienda.service';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ConexionService } from '../../../core/services/conexion.service';
import { CatalogoOfflineService } from '../../../core/services/catalogo-offline.service';
import { OperacionesOfflineService } from '../../../core/services/operaciones-offline.service';
import { SincronizacionService } from '../../../core/sync/sincronizacion.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { DatosReserva, DatosVenta, EstadoOperacion, OperacionLocal } from '../../../core/models/offline';
import { ROLES } from '../../../core/models/sesion';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { AvisoDatosOfflineComponent } from '../../../shared/components/aviso-datos-offline/aviso-datos-offline';
import { fechaHora, haceCuanto } from '../../../shared/utils/fechas';
import { numero } from '../../../shared/utils/formato';

type Filtro = 'TODAS' | 'PENDIENTES' | EstadoOperacion;

/** "Modo offline" + "Pendientes de sincronización" (contrato §6). Para personal y clientes. */
@Component({
  selector: 'app-sincronizacion',
  standalone: true,
  imports: [RouterLink, EstadoBadgeComponent, AvisoDatosOfflineComponent],
  templateUrl: './sincronizacion.html',
})
export class SincronizacionComponent implements OnInit {
  /** Tienda actual: nombre y enlaces relativos a /tienda/:slug. */
  tienda = inject(TiendaService);
  private _asegurarTienda = this.tienda.asegurar();
  auth = inject(AuthService);
  conexion = inject(ConexionService);
  cat = inject(CatalogoOfflineService);
  ops = inject(OperacionesOfflineService);
  sync = inject(SincronizacionService);
  private notif = inject(NotificacionService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  filtro = signal<Filtro>('TODAS');
  sucursales = signal<Map<number, string>>(new Map());

  readonly fecha = fechaHora;
  readonly hace = haceCuanto;
  readonly num = numero;

  puedeResolver = computed(() => this.auth.tieneRol(ROLES.ADMIN, ROLES.ENCARGADO));
  ofreceOffline = computed(() => !this.auth.miEmpresa() || this.auth.tieneFuncion('offline'));

  filtradas = computed(() => {
    const f = this.filtro();
    const lista = this.ops.operaciones();
    if (f === 'TODAS') return lista;
    if (f === 'PENDIENTES') return lista.filter((o) => o.estado === 'LOCAL' || o.estado === 'ENVIADA');
    return lista.filter((o) => o.estado === f);
  });

  readonly filtros: { id: Filtro; texto: string }[] = [
    { id: 'TODAS', texto: 'Todas' },
    { id: 'PENDIENTES', texto: 'Pendientes' },
    { id: 'CONFLICTO', texto: 'En conflicto' },
    { id: 'CONFIRMADA', texto: 'Confirmadas' },
    { id: 'RECHAZADA', texto: 'Rechazadas' },
  ];

  async ngOnInit(): Promise<void> {
    if (!this.esNavegador) return;
    await Promise.all([this.ops.refrescar(), this.cat.recargarMeta()]);
    await this.cargarSucursales();
  }

  private async cargarSucursales(): Promise<void> {
    const lista = await this.cat.sucursales();
    this.sucursales.set(new Map(lista.map((s) => [s.id, s.nombre])));
  }

  contar(f: Filtro): number {
    const c = this.ops.porEstado();
    if (f === 'TODAS') return this.ops.operaciones().length;
    if (f === 'PENDIENTES') return c.LOCAL + c.ENVIADA;
    return c[f];
  }

  async preparar(): Promise<void> {
    try {
      const meta = await this.cat.preparar();
      await this.cargarSucursales();
      if (meta) {
        this.notif.exito(
          `${meta.totales.prendas} prendas, ${meta.totales.variantes} variantes, ${meta.totales.sucursales} sucursal(es)` +
            (meta.totales.clientes ? ` y ${meta.totales.clientes} clientes` : '') + ' guardados en el dispositivo.',
          'Modo offline listo',
        );
      }
    } catch (err) {
      this.notif.errorHttp(err, 'No se pudo preparar el modo offline.');
    }
  }

  sincronizar(): void {
    this.sync.sincronizar(true);
  }

  // ---- presentación de cada operación ----
  total(o: OperacionLocal): number | null {
    return o.tipo === 'VENTA' ? (o.datos as DatosVenta).total : null;
  }
  cliente(o: OperacionLocal): string {
    if (o.tipo === 'VENTA') return (o.datos as DatosVenta).nombre_cliente ?? 'Cliente ocasional';
    return 'Visita: ' + fechaHora((o.datos as DatosReserva).fecha_visita);
  }
  resumenItems(o: OperacionLocal): string {
    return o.datos.items
      .map((i) => `${i.cantidad} × ${i.nombre ?? 'Variante #' + i.variante_id}${i.talla ? ` (${i.talla}${i.color ? ' / ' + i.color : ''})` : ''}`)
      .join(', ');
  }
  nombreSucursal(id: number): string {
    return this.sucursales().get(id) ?? `Sucursal #${id}`;
  }
}
