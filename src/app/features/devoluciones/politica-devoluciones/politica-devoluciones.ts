import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DevolucionesService } from '../../../core/services/devoluciones.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PoliticaDevoluciones } from '../../../core/models/devoluciones';
import { fechaHora } from '../../../shared/utils/fechas';

/** CU-09: política de devoluciones de la empresa (Administrador). */
@Component({
  selector: 'app-politica-devoluciones',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './politica-devoluciones.html',
})
export class PoliticaDevolucionesComponent implements OnInit {
  private svc = inject(DevolucionesService);
  private http = inject(HttpClient);
  private notif = inject(NotificacionService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly politica = signal<PoliticaDevoluciones | null>(null);
  readonly categorias = signal<{ id: number; nombre: string }[]>([]);
  readonly guardando = signal(false);
  readonly fechaHora = fechaHora;

  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.svc.politica().subscribe({
      next: (p) => this.politica.set({ ...p, categorias_no_retornables: [...(p.categorias_no_retornables ?? [])] }),
      error: (e) => this.notif.errorHttp(e, 'No se pudo cargar la política.'),
    });
    this.http.get<any[]>(`${environment.apiUrl}/catalogo/categorias`).subscribe({
      next: (l) => this.categorias.set((l ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))),
    });
  }

  noRetornable(p: PoliticaDevoluciones, id: number): boolean {
    return p.categorias_no_retornables.includes(id);
  }

  alternarCategoria(p: PoliticaDevoluciones, id: number): void {
    p.categorias_no_retornables = this.noRetornable(p, id)
      ? p.categorias_no_retornables.filter((x) => x !== id)
      : [...p.categorias_no_retornables, id];
  }

  guardar(p: PoliticaDevoluciones): void {
    this.guardando.set(true);
    const cuerpo: PoliticaDevoluciones = {
      ...p,
      plazo_cambio_dias: Number(p.plazo_cambio_dias), plazo_garantia_dias: Number(p.plazo_garantia_dias),
      max_cambios_por_prenda: Number(p.max_cambios_por_prenda), max_devoluciones_mes_cliente: Number(p.max_devoluciones_mes_cliente),
      recargo_pct: p.fuera_de_plazo === 'RECARGO' ? Number(p.recargo_pct) : 0,
      vigencia_nota_credito_dias: Number(p.vigencia_nota_credito_dias), umbral_diferencia_caja: Number(p.umbral_diferencia_caja),
    };
    this.svc.guardarPolitica(cuerpo).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.politica.set({ ...r, categorias_no_retornables: [...(r.categorias_no_retornables ?? [])] });
        this.notif.exito('Política de devoluciones guardada.');
      },
      error: (e) => { this.guardando.set(false); this.notif.errorHttp(e, 'No se pudo guardar la política.'); },
    });
  }
}
