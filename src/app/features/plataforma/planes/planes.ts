import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlataformaService } from '../../../core/services/plataforma.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Plan, PlanForm } from '../../../core/models/saas';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { numero } from '../../../shared/utils/formato';
import { IconoComponent } from '../../../shared/components/icono/icono';

const VACIO = (): PlanForm => ({
  codigo: '', nombre: '', precio_mensual: 0, max_sucursales: 1, max_usuarios: null,
  permite_offline: true, permite_reportes_ia: false, activo: true,
});

/** Administrador de plataforma: planes de suscripción. */
@Component({
  selector: 'app-plataforma-planes',
  standalone: true,
  imports: [IconoComponent, FormsModule, EstadoBadgeComponent],
  templateUrl: './planes.html',
})
export class PlataformaPlanesComponent implements OnInit {
  private svc = inject(PlataformaService);
  private notif = inject(NotificacionService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  planes = signal<Plan[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  /** null = cerrado · 0 = nuevo · id = editando */
  editando = signal<number | null>(null);
  form: PlanForm = VACIO();

  readonly num = numero;

  ngOnInit(): void {
    if (this.esNavegador) this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.planes().subscribe({
      next: (p) => { this.planes.set(p); this.cargando.set(false); },
      error: (err) => { this.cargando.set(false); this.notif.errorHttp(err, 'No se pudieron cargar los planes.'); },
    });
  }

  nuevo(): void {
    this.form = VACIO();
    this.editando.set(0);
  }

  editar(p: Plan): void {
    const { id, ...resto } = p;
    this.form = { ...resto };
    this.editando.set(id);
  }

  guardar(): void {
    if (this.guardando()) return;
    const id = this.editando();
    const body: PlanForm = {
      ...this.form,
      codigo: this.form.codigo.trim().toUpperCase(),
      precio_mensual: Number(this.form.precio_mensual),
      max_sucursales: this.vacioANull(this.form.max_sucursales),
      max_usuarios: this.vacioANull(this.form.max_usuarios),
    };
    this.guardando.set(true);
    const obs = id ? this.svc.actualizarPlan(id, body) : this.svc.crearPlan(body);
    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.editando.set(null);
        this.notif.exito(id ? 'Plan actualizado.' : 'Plan creado.');
        this.cargar();
      },
      error: (err) => { this.guardando.set(false); this.notif.errorHttp(err, 'No se pudo guardar el plan.'); },
    });
  }

  private vacioANull(v: unknown): number | null {
    return v === null || v === undefined || v === '' ? null : Number(v);
  }
}
