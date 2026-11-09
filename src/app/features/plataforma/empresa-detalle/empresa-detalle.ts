import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { PlataformaService } from '../../../core/services/plataforma.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { CambioPlan, Empresa, Plan, SuscripcionHistorial } from '../../../core/models/saas';
import { Suscripcion } from '../../../core/models/sesion';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { BarraUsoComponent } from '../../../shared/components/barra-uso/barra-uso';
import { fechaCorta, numero } from '../../../shared/utils/formato';
import { IconoComponent } from '../../../shared/components/icono/icono';

/** Suscripción de una empresa: asignar/cambiar plan, renovar, suspender/reactivar e historial. */
@Component({
  selector: 'app-plataforma-empresa-detalle',
  standalone: true,
  imports: [IconoComponent, FormsModule, RouterLink, EstadoBadgeComponent, BarraUsoComponent],
  templateUrl: './empresa-detalle.html',
})
export class PlataformaEmpresaDetalleComponent implements OnInit {
  private svc = inject(PlataformaService);
  private notif = inject(NotificacionService);
  private route = inject(ActivatedRoute);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  id = '';
  empresa = signal<Empresa | null>(null);
  suscripcion = signal<Suscripcion | null>(null);
  historial = signal<SuscripcionHistorial[]>([]);
  planes = signal<Plan[]>([]);
  cargando = signal(true);
  procesando = signal<string | null>(null);

  cambio: CambioPlan = { plan_codigo: '', periodicidad: 'MENSUAL', fecha_inicio: null };

  readonly fecha = fechaCorta;
  readonly num = numero;

  /** Plan elegido en el formulario (para mostrar sus límites antes de confirmar). */
  planElegido = computed(() => this.planes().find((p) => p.codigo === this.codigoElegido()) ?? null);
  private codigoElegido = signal('');

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.esNavegador) return;
    this.svc.planes().subscribe({ next: (p) => this.planes.set(p.filter((x) => x.activo)) });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      empresa: this.svc.empresa(this.id),
      suscripcion: this.svc.suscripcion(this.id),
      historial: this.svc.historial(this.id),
    }).subscribe({
      next: ({ empresa, suscripcion, historial }) => {
        this.empresa.set(empresa);
        this.suscripcion.set(suscripcion);
        this.historial.set([...historial].sort((a, b) => b.id - a.id));
        this.cambio = {
          plan_codigo: suscripcion.plan?.codigo ?? this.planes()[0]?.codigo ?? '',
          periodicidad: suscripcion.periodicidad ?? 'MENSUAL',
          fecha_inicio: null,
        };
        this.codigoElegido.set(this.cambio.plan_codigo);
        this.cargando.set(false);
      },
      error: (err) => { this.cargando.set(false); this.notif.errorHttp(err, 'No se pudo cargar la empresa.'); },
    });
  }

  elegirPlan(codigo: string): void {
    this.cambio.plan_codigo = codigo;
    this.codigoElegido.set(codigo);
  }

  asignarPlan(): void {
    const plan = this.planElegido();
    const actual = this.suscripcion()?.plan?.codigo;
    const verbo = !actual ? 'Asignar' : actual === this.cambio.plan_codigo ? 'Reasignar' : 'Cambiar a';
    if (!confirm(`${verbo} el plan ${plan?.nombre ?? this.cambio.plan_codigo} (${this.cambio.periodicidad.toLowerCase()}) a ${this.empresa()?.razon_social}?`)) return;
    this.ejecutar('plan', this.svc.asignarPlan(this.id, this.cambio), 'Plan asignado.');
  }

  renovar(): void {
    if (!confirm(`¿Renovar la suscripción de ${this.empresa()?.razon_social} por otro período?`)) return;
    this.ejecutar('renovar', this.svc.renovar(this.id), 'Suscripción renovada.');
  }

  cambiarEstadoSuscripcion(): void {
    const nuevo = this.suscripcion()?.estado === 'SUSPENDIDA' ? 'ACTIVA' : 'SUSPENDIDA';
    const msg = nuevo === 'SUSPENDIDA'
      ? '¿Suspender la suscripción? La empresa no podrá operar hasta reactivarla.'
      : '¿Reactivar la suscripción?';
    if (!confirm(msg)) return;
    this.ejecutar('estado', this.svc.cambiarEstadoSuscripcion(this.id, nuevo),
      nuevo === 'ACTIVA' ? 'Suscripción reactivada.' : 'Suscripción suspendida.');
  }

  private ejecutar(accion: string, obs: Observable<unknown>, exito: string): void {
    this.procesando.set(accion);
    obs.subscribe({
      next: () => { this.procesando.set(null); this.notif.exito(exito); this.cargar(); },
      // 409: p. ej. el downgrade supera el límite de sucursales → el interceptor muestra el detail
      error: (err) => { this.procesando.set(null); this.notif.errorHttp(err, 'No se pudo completar la operación.'); },
    });
  }
}
