import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth';
import { DevolucionesService } from '../../../core/services/devoluciones.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import {
  AccionSolicitud, Disponibilidad, FormaPago, FormaReembolso, ResultadoInspeccion, Solicitud, nombreResolucion,
} from '../../../core/models/devoluciones';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge';
import { fechaCorta, numero } from '../../../shared/utils/formato';
import { fechaHora } from '../../../shared/utils/fechas';
import { IconoComponent } from '../../../shared/components/icono/icono';

interface VarianteCatalogo { variante_id: number; prenda: string; talla: string; color: string; precio: number; }
interface Entrega extends VarianteCatalogo { cantidad: number; }

/** Detalle de una solicitud (CU-02 a CU-08). El personal ve botones según `acciones`; el cliente, solo el seguimiento. */
@Component({
  selector: 'app-detalle-solicitud',
  standalone: true,
  imports: [IconoComponent, CommonModule, FormsModule, RouterLink, EstadoBadgeComponent],
  templateUrl: './detalle-solicitud.html',
})
export class DetalleSolicitudComponent implements OnInit {
  private svc = inject(DevolucionesService);
  private notif = inject(NotificacionService);
  private http = inject(HttpClient);
  auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private ruta = inject(ActivatedRoute);
  private codigo = '';

  readonly sol = signal<Solicitud | null>(null);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly panel = signal<AccionSolicitud | null>(null);
  readonly disponibilidad = signal<Record<number, Disponibilidad>>({});

  // Formularios
  inspeccion: ResultadoInspeccion = 'APTA';
  obsInspeccion = '';
  destinos: Record<number, number | null> = {};
  formaCobroVariante: FormaPago | null = null;
  buscarProducto = '';
  readonly catalogo = signal<VarianteCatalogo[]>([]);
  readonly entregas = signal<Entrega[]>([]);
  formaCobroProducto: FormaPago | null = null;
  formaReembolso: FormaReembolso = 'EFECTIVO';

  readonly numero = numero;
  readonly fechaHora = fechaHora;
  readonly fechaCorta = fechaCorta;
  readonly nombreResolucion = nombreResolucion;
  readonly formasPago: { valor: FormaPago; nombre: string }[] = [
    { valor: 'EFECTIVO', nombre: 'Efectivo' }, { valor: 'QR', nombre: 'QR' }, { valor: 'TARJETA', nombre: 'Tarjeta' },
  ];
  readonly resultadosInspeccion: { valor: ResultadoInspeccion; nombre: string; ayuda: string }[] = [
    { valor: 'APTA', nombre: 'Apta', ayuda: 'Vuelve al stock vendible.' },
    { valor: 'APTA_CON_DESCUENTO', nombre: 'Apta con descuento', ayuda: 'Vuelve al stock vendible.' },
    { valor: 'NO_APTA', nombre: 'No apta', ayuda: 'Pasa a stock no disponible.' },
    { valor: 'INCOMPLETA', nombre: 'Incompleta', ayuda: 'Faltan partes o accesorios.' },
    { valor: 'RECHAZAR', nombre: 'Rechazar la solicitud', ayuda: 'La observación es obligatoria.' },
  ];

  readonly esPersonal = computed(() => this.auth.esPersonal());
  readonly volver = computed(() => (this.esPersonal() ? '/admin/devoluciones' : '/mi-cuenta'));

  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.ruta.paramMap.subscribe((p) => {
      this.codigo = p.get('codigo') ?? '';
      this.panel.set(null);
      this.cargar();
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.detalle(this.codigo).subscribe({
      next: (s) => this.mostrar(s),
      error: (e) => { this.cargando.set(false); this.notif.errorHttp(e, 'No se pudo cargar la solicitud.'); },
    });
  }

  private mostrar(s: Solicitud): void {
    this.sol.set(s);
    this.cargando.set(false);
    this.destinos = Object.fromEntries(s.items.map((i) => [i.id, null]));
    if (this.panel() && !s.acciones.includes(this.panel()!)) this.panel.set(null);
  }

  abrir(a: AccionSolicitud): void {
    this.panel.set(this.panel() === a ? null : a);
    const s = this.sol();
    if (!s) return;
    if (a === 'CAMBIO_VARIANTE' || a === 'SIN_STOCK') this.cargarDisponibilidad(s);
    if (a === 'CAMBIO_PRODUCTO' && !this.catalogo().length) this.cargarCatalogo();
  }

  private cargarDisponibilidad(s: Solicitud): void {
    for (const i of s.items) {
      if (this.disponibilidad()[i.variante_id]) continue;
      this.svc.disponibilidad(i.variante_id).subscribe({
        next: (d) => this.disponibilidad.update((m) => ({ ...m, [i.variante_id]: d })),
        error: (e) => this.notif.errorHttp(e, 'No se pudo consultar la disponibilidad.'),
      });
    }
  }

  private cargarCatalogo(): void {
    this.http.get<any[]>(`${environment.apiUrl}/catalogo/`).subscribe({
      next: (l) => this.catalogo.set((l ?? []).flatMap((p) => (p.variantes ?? []).map((v: any) => ({
        variante_id: v.id, prenda: p.nombre, talla: v.talla, color: v.color, precio: Number(p.precio_base) || 0,
      })))),
    });
  }

  // ---------- etiquetas ----------

  etiquetaAccion(a: AccionSolicitud): string {
    return {
      AUTORIZAR: 'Autorizar', INSPECCIONAR: 'Inspeccionar', CAMBIO_VARIANTE: 'Cambio de talla o color',
      CAMBIO_PRODUCTO: 'Cambio por otro producto', REEMBOLSO: 'Reembolso', SIN_STOCK: 'Sin stock',
    }[a];
  }

  etiquetaCanal(c: string): string {
    return c === 'OFFLINE' ? 'Sin conexión' : c === 'EN_LINEA' || c === 'WEB' ? 'En línea (cliente)' : c === 'TIENDA' ? 'En tienda' : c;
  }

  // ---------- cambio de variante (CU-04) ----------

  /** Otras tallas/colores del mismo modelo, con el stock en la sucursal de la solicitud. */
  opcionesVariante(varianteId: number): { variante_id: number; talla: string; color: string; stock: number }[] {
    const d = this.disponibilidad()[varianteId];
    const suc = this.sol()?.sucursal.id;
    if (!d) return [];
    const mapa = new Map<number, { variante_id: number; talla: string; color: string; stock: number }>();
    for (const x of d.en_sucursales) {
      if (x.variante_id === varianteId) continue;
      const prev = mapa.get(x.variante_id) ?? { variante_id: x.variante_id, talla: x.talla, color: x.color, stock: 0 };
      if (x.sucursal_id === suc) prev.stock = x.stock;
      mapa.set(x.variante_id, prev);
    }
    return [...mapa.values()];
  }

  get cambioVarianteValido(): boolean {
    const s = this.sol();
    return !!s && s.items.every((i) => !!this.destinos[i.id]) && (!(s.recargo > 0) || !!this.formaCobroVariante);
  }

  cambioVariante(): void {
    const s = this.sol();
    if (!s || !this.cambioVarianteValido) return;
    const items = s.items.map((i) => ({ detalle_id: i.id, variante_id: Number(this.destinos[i.id]) }));
    this.ejecutar(this.svc.cambioVariante(s.codigo, items, s.recargo > 0 ? this.formaCobroVariante : null), 'Cambio realizado.');
  }

  // ---------- cambio de producto (CU-05) ----------

  get productosFiltrados(): VarianteCatalogo[] {
    const q = this.buscarProducto.trim().toLowerCase();
    if (q.length < 2) return [];
    return this.catalogo().filter((v) => `${v.prenda} ${v.talla} ${v.color}`.toLowerCase().includes(q)).slice(0, 12);
  }

  agregarEntrega(v: VarianteCatalogo): void {
    this.entregas.update((l) => {
      const e = l.find((x) => x.variante_id === v.variante_id);
      return e ? l.map((x) => (x === e ? { ...x, cantidad: x.cantidad + 1 } : x)) : [...l, { ...v, cantidad: 1 }];
    });
  }

  quitarEntrega(id: number): void {
    this.entregas.update((l) => l.filter((x) => x.variante_id !== id));
  }

  cambiarCantidad(id: number, c: number): void {
    this.entregas.update((l) => l.map((x) => (x.variante_id === id ? { ...x, cantidad: Math.max(1, Math.floor(Number(c) || 1)) } : x)));
  }

  readonly valorEntregas = computed(() => this.entregas().reduce((s, e) => s + e.precio * e.cantidad, 0));
  /** > 0 paga el cliente; < 0 se emite nota de crédito por la diferencia. */
  readonly diferenciaProducto = computed(() => Math.round((this.valorEntregas() - (this.sol()?.monto_a_favor ?? 0)) * 100) / 100);

  get cambioProductoValido(): boolean {
    return this.entregas().length > 0 && (this.diferenciaProducto() <= 0 || !!this.formaCobroProducto);
  }

  cambioProducto(): void {
    const s = this.sol();
    if (!s || !this.cambioProductoValido) return;
    const items = this.entregas().map((e) => ({ variante_id: e.variante_id, cantidad: e.cantidad }));
    this.ejecutar(this.svc.cambioProducto(s.codigo, items, this.diferenciaProducto() > 0 ? this.formaCobroProducto : null), 'Cambio realizado.');
  }

  // ---------- otras acciones ----------

  autorizar(): void {
    const s = this.sol();
    if (s) this.ejecutar(this.svc.autorizar(s.codigo), 'Solicitud autorizada.');
  }

  inspeccionar(): void {
    const s = this.sol();
    if (!s) return;
    if (this.inspeccion === 'RECHAZAR' && !this.obsInspeccion.trim()) return;
    this.ejecutar(this.svc.inspeccionar(s.codigo, this.inspeccion, this.obsInspeccion.trim() || null), 'Inspección registrada.');
  }

  reembolsar(): void {
    const s = this.sol();
    if (s) this.ejecutar(this.svc.reembolso(s.codigo, this.formaReembolso), 'Reembolso registrado.');
  }

  sinStock(decision: 'NOTA_CREDITO' | 'ESPERAR_STOCK'): void {
    const s = this.sol();
    if (s) this.ejecutar(this.svc.sinStock(s.codigo, decision),
      decision === 'NOTA_CREDITO' ? 'Nota de crédito emitida.' : 'La solicitud queda esperando stock.');
  }

  private ejecutar(obs: Observable<Solicitud>, exito: string): void {
    this.enviando.set(true);
    obs.subscribe({
      next: (s) => {
        this.enviando.set(false);
        this.notif.exito(s.nota_credito && !this.sol()?.nota_credito
          ? `${exito} Nota de crédito ${s.nota_credito.codigo} por Bs ${numero(s.nota_credito.monto)}.` : exito);
        this.panel.set(null);
        this.entregas.set([]);
        this.mostrar(s);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.notif.errorHttp(e, 'No se pudo completar la operación.');
        // Sin stock para entregar: se ofrece la disponibilidad y la decisión (CU-08).
        const detalle = NotificacionService.detalle(e) ?? '';
        const s = this.sol();
        if (e.status === 409 && /sin stock/i.test(detalle) && s?.acciones.includes('SIN_STOCK')) {
          this.panel.set('SIN_STOCK');
          this.cargarDisponibilidad(s);
        }
      },
    });
  }
}
