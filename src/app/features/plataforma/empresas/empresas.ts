import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlataformaService } from '../../../core/services/plataforma.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { EmpresaConSuscripcion, EmpresaNueva, Plan } from '../../../core/models/saas';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { fechaCorta } from '../../../shared/utils/formato';

const VACIA = (): EmpresaNueva => ({
  razon_social: '', nit: '', slug: '', correo: '', telefono: '',
  plan_codigo: '', periodicidad: 'MENSUAL',
  admin_nombre: '', admin_email: '', admin_password: '',
});

/** Administrador de plataforma: listar, registrar y suspender/reactivar empresas. */
@Component({
  selector: 'app-plataforma-empresas',
  standalone: true,
  imports: [FormsModule, RouterLink, LowerCasePipe, EstadoBadgeComponent],
  templateUrl: './empresas.html',
})
export class PlataformaEmpresasComponent implements OnInit {
  private svc = inject(PlataformaService);
  private notif = inject(NotificacionService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  empresas = signal<EmpresaConSuscripcion[]>([]);
  planes = signal<Plan[]>([]);
  cargando = signal(true);
  mostrandoForm = signal(false);
  guardando = signal(false);
  procesando = signal<string | null>(null);
  nueva: EmpresaNueva = VACIA();
  slugEditado = false;

  readonly fecha = fechaCorta;

  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.cargar();
    this.svc.planes().subscribe({ next: (p) => this.planes.set(p.filter((x) => x.activo)) });
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.empresas().subscribe({
      next: (e) => { this.empresas.set(e); this.cargando.set(false); },
      error: (err) => { this.cargando.set(false); this.notif.errorHttp(err, 'No se pudieron cargar las empresas.'); },
    });
  }

  abrirForm(): void {
    this.nueva = VACIA();
    this.nueva.plan_codigo = this.planes()[0]?.codigo ?? '';
    this.slugEditado = false;
    this.mostrandoForm.set(true);
  }

  /** Propone el slug a partir de la razón social mientras no se edite a mano. */
  sugerirSlug(): void {
    if (this.slugEditado) return;
    this.nueva.slug = this.nueva.razon_social
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\b(s\.?r\.?l\.?|s\.?a\.?|ltda\.?)\b/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  registrar(): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    const body: EmpresaNueva = { ...this.nueva };
    if (!body.correo?.trim()) delete body.correo;
    if (!body.telefono?.trim()) delete body.telefono;
    this.svc.registrarEmpresa(body).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrandoForm.set(false);
        this.notif.exito(`Empresa "${body.razon_social}" registrada. Su administrador ya puede iniciar sesión.`);
        this.cargar();
      },
      // 409: NIT, slug o email duplicado → el interceptor muestra el detail
      error: (err) => { this.guardando.set(false); this.notif.errorHttp(err, 'No se pudo registrar la empresa.'); },
    });
  }

  cambiarEstado(e: EmpresaConSuscripcion): void {
    const nuevo = e.estado === 'ACTIVA' ? 'SUSPENDIDA' : 'ACTIVA';
    const msg = nuevo === 'SUSPENDIDA'
      ? `¿Suspender "${e.razon_social}"? Sus usuarios no podrán iniciar sesión.`
      : `¿Reactivar "${e.razon_social}"?`;
    if (!confirm(msg)) return;
    this.procesando.set(e.id);
    this.svc.cambiarEstadoEmpresa(e.id, nuevo).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notif.exito(`"${e.razon_social}" quedó ${nuevo === 'ACTIVA' ? 'activa' : 'suspendida'}.`);
        this.cargar();
      },
      error: (err) => { this.procesando.set(null); this.notif.errorHttp(err, 'No se pudo cambiar el estado.'); },
    });
  }
}
