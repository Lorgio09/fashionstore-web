import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { ConflictosService, Conflicto } from '../../../core/services/conflictos.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { SincronizacionService } from '../../../core/sync/sincronizacion.service';
import { ROLES } from '../../../core/models/sesion';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { EmpresaService } from '../../../core/services/empresa.service';
import { SucursalEmpresa } from '../../../core/models/saas';
import { fechaHora } from '../../../shared/utils/fechas';
import { numero } from '../../../shared/utils/formato';

interface EdicionConflicto {
  modo: 'NINGUNO' | 'AJUSTAR' | 'RECHAZAR';
  cantidades: Record<number, number>;
  motivo: string;
  enviando: boolean;
}

/** Conflictos de sincronización (contrato §6.4). Encargado (su sucursal) y Administrador. */
@Component({
  selector: 'app-conflictos',
  standalone: true,
  imports: [FormsModule, EstadoBadgeComponent],
  templateUrl: './conflictos.html',
})
export class ConflictosComponent implements OnInit {
  auth = inject(AuthService);
  private svc = inject(ConflictosService);
  private notif = inject(NotificacionService);
  private sync = inject(SincronizacionService);
  private empresa = inject(EmpresaService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  conflictos = signal<Conflicto[]>([]);
  cargando = signal(false);
  /** null = todas las sucursales (solo Administrador). */
  sucursalId = signal<number | null>(null);
  edicion = signal<Record<string, EdicionConflicto>>({});
  sucursales = signal<SucursalEmpresa[]>([]);

  esAdmin = computed(() => this.auth.tieneRol(ROLES.ADMIN));
  readonly fecha = fechaHora;
  readonly num = numero;

  ngOnInit(): void {
    if (!this.esNavegador) return;
    // El Encargado solo ve su sucursal (lo filtra el servidor); el Administrador ve todas por defecto.
    this.cargar();
    if (this.esAdmin()) this.empresa.sucursales().subscribe({ next: (l) => this.sucursales.set(l) });
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.listar(this.sucursalId()).subscribe({
      next: (lista) => {
        this.conflictos.set(lista);
        const ed: Record<string, EdicionConflicto> = {};
        for (const c of lista) {
          ed[c.uuid] = this.edicion()[c.uuid] ?? {
            modo: 'NINGUNO',
            cantidades: Object.fromEntries(c.items.map((i) => [i.variante_id, Math.min(i.cantidad, Math.max(0, i.stock_actual))])),
            motivo: '',
            enviando: false,
          };
        }
        this.edicion.set(ed);
        this.cargando.set(false);
      },
      error: (err) => { this.cargando.set(false); this.notif.errorHttp(err, 'No se pudieron cargar los conflictos.'); },
    });
  }

  filtrarSucursal(id: number | null): void {
    this.sucursalId.set(id);
    this.cargar();
  }

  ed(uuid: string): EdicionConflicto {
    return this.edicion()[uuid];
  }

  modo(uuid: string, modo: EdicionConflicto['modo']): void {
    this.edicion.update((e) => ({ ...e, [uuid]: { ...e[uuid], modo } }));
  }

  totalAjustado(c: Conflicto): number {
    const e = this.ed(c.uuid);
    return c.items.reduce((s, i) => s + (e.cantidades[i.variante_id] ?? 0) * (i.precio_unitario ?? 0), 0);
  }

  ajusteValido(c: Conflicto): boolean {
    const e = this.ed(c.uuid);
    const items = c.items.map((i) => e.cantidades[i.variante_id] ?? 0);
    return items.some((q) => q > 0) && c.items.every((i) => {
      const q = e.cantidades[i.variante_id] ?? 0;
      return Number.isInteger(q) && q >= 0 && q <= i.cantidad;
    });
  }

  ajustar(c: Conflicto): void {
    const e = this.ed(c.uuid);
    // Los ítems con 0 se omiten: el servidor los quita de la operación.
    const items = c.items
      .map((i) => ({ variante_id: i.variante_id, cantidad: Number(e.cantidades[i.variante_id] ?? 0) }))
      .filter((i) => i.cantidad > 0);
    this.enviar(c, this.svc.ajustar(c.uuid, items), 'Operación ajustada y confirmada.');
  }

  rechazar(c: Conflicto): void {
    const motivo = this.ed(c.uuid).motivo.trim();
    if (!motivo) return;
    this.enviar(c, this.svc.rechazar(c.uuid, motivo), 'Operación rechazada.');
  }

  private enviar(c: Conflicto, obs: ReturnType<ConflictosService['ajustar']>, exito: string): void {
    this.edicion.update((e) => ({ ...e, [c.uuid]: { ...e[c.uuid], enviando: true } }));
    obs.subscribe({
      next: (r) => {
        this.notif.exito(`${exito}${r.servidor_id ? ' Registro #' + r.servidor_id + '.' : ''}`);
        this.conflictos.update((l) => l.filter((x) => x.uuid !== c.uuid));
        // Si la operación es de este dispositivo, su estado local se actualiza con /sync/estado.
        this.sync.sincronizar();
      },
      error: (err: HttpErrorResponse) => {
        this.edicion.update((e) => ({ ...e, [c.uuid]: { ...e[c.uuid], enviando: false } }));
        // 409: aún no alcanza el stock, o ya no está en conflicto → el interceptor muestra el detail
        this.notif.errorHttp(err, 'No se pudo resolver el conflicto.');
        if (err.status === 409) this.cargar();
      },
    });
  }
}
