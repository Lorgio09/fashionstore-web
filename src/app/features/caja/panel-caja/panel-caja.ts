import { Component, PLATFORM_ID, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ROLES } from '../../../core/models/sesion';
import { CajaService } from '../../../core/services/caja.service';
import { ConexionService } from '../../../core/services/conexion.service';
import { DevolucionesService } from '../../../core/services/devoluciones.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { OperacionesOfflineService } from '../../../core/services/operaciones-offline.service';
import { PendientesLocales, TurnoCaja } from '../../../core/models/caja';
import { numero } from '../../../shared/utils/formato';
import { fechaHora } from '../../../shared/utils/fechas';

/**
 * Caja del punto de venta (CU-20): abrir con fondo inicial, arqueo en vivo y cierre con el efectivo contado.
 * Al cerrar se informan las ventas que siguen en LOCAL en este dispositivo (`pendientes_locales`).
 */
@Component({
  selector: 'app-panel-caja',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './panel-caja.html',
})
export class PanelCajaComponent {
  private svc = inject(CajaService);
  private devoluciones = inject(DevolucionesService);
  private ops = inject(OperacionesOfflineService);
  private notif = inject(NotificacionService);
  private auth = inject(AuthService);
  conexion = inject(ConexionService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Sucursal del punto de venta (0 = todavía no elegida). */
  sucursalId = input<number>(0);

  readonly turno = signal<TurnoCaja | null>(null);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly verArqueo = signal(false);
  readonly cerrando = signal(false);
  readonly pendientes = signal<PendientesLocales>({ cantidad: 0, monto_efectivo: 0 });
  readonly umbral = signal<number | null>(null);
  /** Último cierre hecho desde este panel (para mostrar el resultado). */
  readonly ultimoCierre = signal<TurnoCaja | null>(null);

  fondoInicial: number | null = null;
  readonly contado = signal<number | null>(null);
  observacion = '';

  readonly esCajero = computed(() => this.auth.tieneRol(ROLES.CAJERO));
  readonly numero = numero;
  readonly fechaHora = fechaHora;

  readonly diferencia = computed(() => {
    const c = this.contado();
    const esperado = this.turno()?.arqueo?.efectivo_esperado;
    if (c === null || c === undefined || (c as unknown) === '' || esperado === undefined) return null;
    return Math.round((Number(c) - esperado) * 100) / 100;
  });

  readonly superaUmbral = computed(() => {
    const d = this.diferencia();
    const u = this.umbral();
    return d !== null && u !== null && Math.abs(d) > u;
  });

  constructor() {
    // Recarga al cambiar de sucursal o al volver la conexión.
    effect(() => {
      const id = this.sucursalId();
      const enLinea = this.conexion.enLinea();
      if (!this.esNavegador) return;
      untracked(() => {
        if (id && enLinea) this.refrescar();
        else this.turno.set(null);
      });
    });
  }

  /** Arqueo en vivo (lo llama el POS después de cada venta). */
  refrescar(): void {
    const id = this.sucursalId();
    if (!id || !this.conexion.enLinea()) return;
    this.cargando.set(true);
    this.svc.actual(id).subscribe({
      next: (t) => { this.turno.set(t); this.cargando.set(false); },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.turno.set(null);
        if (e.status !== 404) this.notif.errorHttp(e, 'No se pudo consultar la caja.'); // 404 = no hay caja abierta
      },
    });
  }

  abrir(): void {
    const fondo = Number(this.fondoInicial);
    if (this.fondoInicial === null || isNaN(fondo) || fondo < 0) return;
    this.enviando.set(true);
    this.svc.abrir(fondo, this.sucursalId()).subscribe({
      next: (t) => {
        this.enviando.set(false);
        this.turno.set(t);
        this.ultimoCierre.set(null);
        this.fondoInicial = null;
        this.notif.exito(`Caja abierta con un fondo de Bs ${numero(fondo)}.`);
      },
      error: (e) => { this.enviando.set(false); this.notif.errorHttp(e, 'No se pudo abrir la caja.'); },
    });
  }

  async iniciarCierre(): Promise<void> {
    this.cerrando.set(!this.cerrando());
    if (!this.cerrando()) return;
    this.refrescar(); // efectivo esperado al momento
    this.pendientes.set(await this.ops.ventasLocalesDe(this.sucursalId()));
    if (this.umbral() === null) {
      this.devoluciones.politica().subscribe({ next: (p) => this.umbral.set(p.umbral_diferencia_caja), error: () => {} });
    }
  }

  get cierreValido(): boolean {
    const d = this.diferencia();
    return d !== null && Number(this.contado()) >= 0 && (Math.abs(d) < 0.01 || !!this.observacion.trim());
  }

  cerrar(): void {
    if (!this.cierreValido || this.enviando()) return;
    const p = this.pendientes();
    this.enviando.set(true);
    this.svc.cerrar(this.sucursalId(), Number(this.contado()), this.observacion.trim() || null, p.cantidad ? p : null).subscribe({
      next: (t) => {
        this.enviando.set(false);
        this.ultimoCierre.set(t);
        this.turno.set(null);
        this.cerrando.set(false);
        this.verArqueo.set(false);
        this.contado.set(null);
        this.observacion = '';
        if (t.estado === 'PENDIENTE_AUTORIZACION') {
          this.notif.aviso(`La diferencia de Bs ${numero(t.diferencia)} supera el umbral: el cierre espera la autorización del Encargado.`, 'Caja pendiente de autorización');
        } else {
          this.notif.exito(`Caja cerrada. Diferencia: Bs ${numero(t.diferencia)}.`);
        }
      },
      error: (e) => {
        this.enviando.set(false);
        this.notif.errorHttp(e, 'No se pudo cerrar la caja.');
        this.refrescar();
      },
    });
  }
}
