import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, computed, effect, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ConexionService } from '../../../core/services/conexion.service';
import { CatalogoOfflineService, ProductoPOS } from '../../../core/services/catalogo-offline.service';
import { OperacionesOfflineService } from '../../../core/services/operaciones-offline.service';
import { SelectorSucursalComponent } from '../../../shared/components/selector-sucursal/selector-sucursal';
import { AvisoDatosOfflineComponent } from '../../../shared/components/aviso-datos-offline/aviso-datos-offline';
import { numero } from '../../../shared/utils/formato';

export interface ItemCarrito {
  prenda_id: number;
  variante_id: number;
  nombre: string;
  talla?: string;
  color?: string;
  precio: number;
  cantidad: number;
}

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SelectorSucursalComponent, AvisoDatosOfflineComponent],
  templateUrl: './punto-venta.html'
})
export class PuntoVentaComponent implements OnInit {
  private notif = inject(NotificacionService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  conexion = inject(ConexionService);
  catOffline = inject(CatalogoOfflineService);
  private opsOffline = inject(OperacionesOfflineService);

  productosDisponibles: ProductoPOS[] = [];
  busqueda = '';
  carrito: ItemCarrito[] = [];
  total: number = 0;

  metodoPagoSeleccionado: string = 'EFECTIVO';
  procesando: boolean = false;
  sucursalId: number = 0;
  qrGenerado: string | null = null;

  /** Sin red: venta de contado guardada en IndexedDB (contrato §6). */
  readonly modoOffline = computed(() => !this.conexion.enLinea());
  /** Sin red y sin catálogo local de esta sesión. */
  readonly sinCatalogoLocal = signal(false);

  private API_URL = `${environment.apiUrl}`;

  constructor() {
    // Al cambiar la conexión se recarga el catálogo de la fuente que corresponda.
    let previo: boolean | null = null;
    effect(() => {
      const offline = this.modoOffline();
      if (previo !== null && previo !== offline) {
        if (offline) {
          this.metodoPagoSeleccionado = 'EFECTIVO'; // sin red solo efectivo
          this.qrGenerado = null;
        }
        setTimeout(() => this.cargarProductosStock());
      }
      previo = offline;
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // La sucursal la fija <app-selector-sucursal> (asignada al usuario o elegida por el Administrador).
      this.sucursalId = this.authService.usuario()?.sucursal_id ?? 0;
      this.cargarProductosStock();
    }
  }

  cambiarSucursal(id: number) {
    const cambio = id !== this.sucursalId;
    this.sucursalId = id;
    // Sin red el stock estimado depende de la sucursal.
    if (cambio && this.modoOffline()) this.cargarProductosStock();
  }

  get productosFiltrados(): ProductoPOS[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.productosDisponibles;
    return this.productosDisponibles.filter((p) =>
      `${p.nombre} ${p.talla} ${p.color} ${p.codigo_sku ?? ''}`.toLowerCase().includes(q));
  }

  cargarProductosStock() {
    if (this.modoOffline()) {
      this.cargarProductosLocales();
      return;
    }
    this.sinCatalogoLocal.set(false);
    this.http.get<any[]>(`${this.API_URL}/catalogo/`).subscribe({
      next: (data) => {
        const catalogoProcesado: ProductoPOS[] = [];
        (data ?? []).forEach(prenda => {
          if (prenda.variantes && prenda.variantes.length > 0) {
            prenda.variantes.forEach((variante: any) => {
              catalogoProcesado.push({
                prenda_id: prenda.id,
                variante_id: variante.id,
                nombre: prenda.nombre,
                precio: prenda.precio_base,
                imagen_url: prenda.imagen_url,
                talla: variante.talla,
                color: variante.color,
                codigo_sku: variante.codigo_sku ?? variante.sku
              });
            });
          }
        });
        this.productosDisponibles = catalogoProcesado;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        // Sin respuesta del servidor: se intenta con el catálogo local.
        if (err.status === 0) this.cargarProductosLocales();
        else console.error('Error al cargar catálogo:', err);
      }
    });
  }

  private async cargarProductosLocales() {
    const hay = await this.catOffline.disponible();
    this.sinCatalogoLocal.set(!hay);
    this.productosDisponibles = hay && this.sucursalId ? await this.catOffline.productosPOS(this.sucursalId) : [];
    this.cdr.detectChanges();
  }

  agregarAlCarrito(producto: ProductoPOS) {
    const itemExistente = this.carrito.find(item => item.variante_id === producto.variante_id);
    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.carrito.push({
        prenda_id: producto.prenda_id,
        variante_id: producto.variante_id,
        nombre: producto.nombre,
        talla: producto.talla,
        color: producto.color,
        precio: producto.precio,
        cantidad: 1
      });
    }
    this.calcularTotal();
  }

  quitarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.total = Math.round(this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0) * 100) / 100;
  }

  seleccionarMetodo(metodo: string) {
    if (this.modoOffline() && metodo !== 'EFECTIVO') return;
    this.metodoPagoSeleccionado = metodo;
    this.qrGenerado = null;
  }

  limpiarCaja() {
    this.carrito = [];
    this.calcularTotal();
    this.qrGenerado = null;
    this.cargarProductosStock();
  }

  confirmarVenta() {
    if (this.carrito.length === 0) return;
    if (this.modoOffline()) {
      this.registrarVentaOffline();
      return;
    }
    this.procesando = true;
    this.qrGenerado = null;

    if (this.metodoPagoSeleccionado === 'EFECTIVO') {
      const payloadEfectivo = {
        sucursal_id: this.sucursalId,
        metodo_pago: 'EFECTIVO',
        total: this.total,
        items: this.carrito.map(item => ({
          prenda_id: item.prenda_id,
          variante_id: item.variante_id,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      };

      this.http.post(`${this.API_URL}/catalogo/checkout/presencial`, payloadEfectivo).subscribe({
        next: () => {
          this.notif.exito(`Venta en efectivo de Bs ${numero(this.total)} registrada.`);
          this.limpiarCaja();
          this.procesando = false;
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.procesando = false;
          this.cdr.detectChanges();
          if (err.status === 0) {
            // La red se cayó al cobrar: se ofrece guardarla sin conexión (se envía al volver la red).
            if (confirm('No hay conexión con el servidor. ¿Guardar la venta en el dispositivo para enviarla al volver la red?')) {
              this.registrarVentaOffline();
            }
            return;
          }
          this.notif.errorHttp(err, 'Error al registrar la venta en efectivo.');
        }
      });
    }
    else if (this.metodoPagoSeleccionado === 'QR') {
      const payloadQR = {
        nombre_cliente: "Cliente en Caja",
        correo_cliente: "caja@fashionstore.com",
        telefono_cliente: "00000000",
        direccion_envio: "Retiro en Sucursal",
        items: this.carrito.map(item => ({
          prenda_id: item.prenda_id,
          variante_id: item.variante_id,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      };

      this.http.post(`${this.API_URL}/catalogo/checkout`, payloadQR).subscribe({
        next: (res: any) => {
          this.qrGenerado = res.qr_imagen_base64;
          this.procesando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.notif.errorHttp(err, 'Error al generar el QR con el BCP.');
          this.procesando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  /** Venta de contado sin red: queda LOCAL en IndexedDB y descuenta el stock estimado. */
  private async registrarVentaOffline() {
    if (!this.sucursalId) {
      this.notif.error('Elige la sucursal de la venta.');
      return;
    }
    // Aviso si se vende más de lo que se cree que hay: el servidor podría dejarla en CONFLICTO.
    const stock = new Map(this.productosDisponibles.map(p => [p.variante_id, p.stock ?? 0]));
    const faltantes = this.carrito.filter(i => stock.has(i.variante_id) && i.cantidad > (stock.get(i.variante_id) ?? 0));
    if (faltantes.length && !confirm(
      'Stock estimado insuficiente para: ' + faltantes.map(f => `${f.nombre} ${f.talla ?? ''} (hay ${stock.get(f.variante_id)})`).join(', ') +
      '.\n¿Registrar igual? Al sincronizar podría quedar en conflicto.')) {
      return;
    }

    this.procesando = true;
    try {
      const total = this.total;
      await this.opsOffline.registrarVenta({
        sucursal_id: this.sucursalId,
        items: this.carrito.map(i => ({
          variante_id: i.variante_id, cantidad: i.cantidad, precio_unitario: i.precio,
          nombre: i.nombre, talla: i.talla, color: i.color,
        })),
      });
      this.notif.exito(`Venta de Bs ${numero(total)} guardada en el dispositivo. Se enviará al volver la conexión.`, 'Venta sin conexión');
      this.carrito = [];
      this.calcularTotal();
      await this.cargarProductosLocales(); // stock estimado actualizado
    } catch (e: any) {
      this.notif.error(e?.message ?? 'No se pudo guardar la venta en el dispositivo.');
    } finally {
      this.procesando = false;
      this.cdr.detectChanges();
    }
  }
}
