import { Component, OnChanges, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DevolucionesService } from '../../../core/services/devoluciones.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import {
  MOTIVOS, MotivoDevolucion, RESOLUCIONES, ResolucionDevolucion, Solicitud, VentaDevolucion,
} from '../../../core/models/devoluciones';
import { fechaCorta, numero } from '../../../shared/utils/formato';
import { fechaHora } from '../../../shared/utils/fechas';
import { IconoComponent } from '../../../shared/components/icono/icono';

/** Registrar una solicitud de devolución o cambio a partir de una venta (CU-01 / CU-02). Lo usan el personal y el cliente. */
@Component({
  selector: 'app-formulario-solicitud',
  standalone: true,
  imports: [IconoComponent, CommonModule, FormsModule],
  templateUrl: './formulario-solicitud.html',
})
export class FormularioSolicitudComponent implements OnChanges {
  private svc = inject(DevolucionesService);
  private notif = inject(NotificacionService);
  private http = inject(HttpClient);

  venta = input.required<VentaDevolucion>();
  /** El cliente puede elegir en qué sucursal entrega la prenda. */
  esCliente = input(false);
  creada = output<Solicitud>();
  cancelar = output<void>();

  cantidades: Record<number, number> = {};
  motivo: MotivoDevolucion | '' = '';
  resolucion: ResolucionDevolucion | '' = '';
  observacion = '';
  sucursalId: number | null = null;
  readonly sucursales = signal<{ id: number; nombre: string }[]>([]);
  readonly enviando = signal(false);

  readonly motivos = MOTIVOS;
  readonly resoluciones = RESOLUCIONES;
  readonly numero = numero;
  readonly fechaCorta = fechaCorta;
  readonly fechaHora = fechaHora;

  ngOnChanges(): void {
    this.cantidades = Object.fromEntries(this.venta().items.map((i) => [i.detalle_orden_id, 0]));
    if (this.esCliente()) {
      // El cliente elige dónde entrega la prenda (obligatorio: una compra web no tiene sucursal física).
      const preseleccionar = () => {
        const suc = this.venta().sucursal_id;
        this.sucursalId = this.sucursales().some((x) => x.id === suc) ? suc! : null;
      };
      if (this.sucursales().length) preseleccionar();
      else this.http.get<any[]>(`${environment.apiUrl}/catalogo/sucursales`).subscribe({
        next: (l) => { this.sucursales.set((l ?? []).map((s) => ({ id: s.id, nombre: s.nombre }))); preseleccionar(); },
      });
    }
  }

  get seleccion(): { detalle_orden_id: number; cantidad: number }[] {
    return Object.entries(this.cantidades)
      .map(([id, c]) => ({ detalle_orden_id: Number(id), cantidad: Number(c) || 0 }))
      .filter((x) => x.cantidad > 0);
  }

  get valorSeleccionado(): number {
    return this.seleccion.reduce((s, x) => {
      const it = this.venta().items.find((i) => i.detalle_orden_id === x.detalle_orden_id);
      return s + (it ? it.precio_unitario * x.cantidad : 0);
    }, 0);
  }

  /** Las categorías no retornables solo se aceptan por defecto (lo valida el servidor; aquí se avisa). */
  get avisoNoRetornable(): boolean {
    return this.motivo !== 'DEFECTO' && this.seleccion.some((x) =>
      this.venta().items.find((i) => i.detalle_orden_id === x.detalle_orden_id)?.retornable === false);
  }

  get valido(): boolean {
    const items = this.venta().items;
    return !!this.motivo && !!this.resolucion && this.seleccion.length > 0 && (!this.esCliente() || !!this.sucursalId) && this.seleccion.every((x) => {
      const it = items.find((i) => i.detalle_orden_id === x.detalle_orden_id);
      return !!it && Number.isInteger(x.cantidad) && x.cantidad <= it.elegible;
    });
  }

  enviar(): void {
    if (!this.valido || this.enviando()) return;
    this.enviando.set(true);
    this.svc.crear({
      orden_id: this.venta().orden_id,
      items: this.seleccion,
      motivo: this.motivo as MotivoDevolucion,
      resolucion: this.resolucion as ResolucionDevolucion,
      sucursal_id: this.esCliente() ? this.sucursalId : null,
      observacion: this.observacion.trim() || null,
    }).subscribe({
      next: (s) => {
        this.enviando.set(false);
        this.notif.exito(`Solicitud ${s.codigo} registrada.`);
        this.creada.emit(s);
      },
      error: (e) => {
        this.enviando.set(false);
        this.notif.errorHttp(e, 'No se pudo registrar la solicitud.');
      },
    });
  }
}
