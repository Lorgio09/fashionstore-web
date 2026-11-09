import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel en el modal
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CarritoService, ItemCarrito } from '../../shared/services/carrito.service';
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/services/notificacion.service';
import { ConexionService } from '../../core/services/conexion.service';
import { CatalogoOfflineService } from '../../core/services/catalogo-offline.service';
import { OperacionesOfflineService } from '../../core/services/operaciones-offline.service';
import { ROLES } from '../../core/models/sesion';
import { fechaHoraLocalSinZona } from '../../shared/utils/fechas';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
  private notif = inject(NotificacionService);
  private http = inject(HttpClient);
  private carritoService = inject(CarritoService);
  private reservaService = inject(ReservaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private conexion = inject(ConexionService);
  private catOffline = inject(CatalogoOfflineService);
  private opsOffline = inject(OperacionesOfflineService);

  items: ItemCarrito[] = [];
  total: number = 0;

  // Variables para el Modal de Reserva
  mostrarModalReserva: boolean = false;
  /** La reserva se guarda en el dispositivo y se envía al volver la red (contrato §6). */
  reservaOffline = false;
  guardando = false;
  fechaVisita: string = '';
  sucursalSeleccionada: number = 0;

  sucursales: any[] = [];

  ngOnInit() {
    this.carritoService.carrito$.subscribe(datos => {
      this.items = datos;
      this.calcularTotal();
    });
  }

  calcularTotal() {
    this.total = this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  vaciarCarrito() {
    if (confirm('¿Estás seguro de vaciar tu carrito?')) {
      this.limpiarDatosCarrito();
    }
  }

  private limpiarDatosCarrito() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('carrito_compras');
    }
    window.location.reload();
  }

  // --- LÓGICA DE RESERVAS ---

  abrirModalReserva() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) {
      alert('Debes iniciar sesión para poder reservar prendas.');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.conexion.enLinea()) {
      this.abrirReservaOffline();
      return;
    }

    // 1. Armamos lo que vamos a consultar al backend
    const payloadCheck = this.items.map(item => ({
      variante_id: item.variante_id,
      cantidad: item.cantidad
    }));

    // 2. Sucursales que tienen stock para todo el carrito
    this.http.post<any[]>(`${environment.apiUrl}/catalogo/sucursales-disponibles`, payloadCheck).subscribe({
      next: (sucursalesValidas) => {
        this.sucursales = sucursalesValidas;
        if (this.sucursales.length === 0) {
          alert("Lo sentimos, ninguna sucursal tiene stock suficiente para todas las prendas de tu carrito juntas.");
          return;
        }
        this.reservaOffline = false;
        this.mostrarModalReserva = true;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.abrirReservaOffline(); // la red se cayó: se reserva en el dispositivo
          return;
        }
        this.notif.errorHttp(err, 'Ocurrió un error al verificar la disponibilidad en tiendas.');
      }
    });
  }

  /** Sin red: sucursales y stock del catálogo guardado en el dispositivo. */
  private async abrirReservaOffline() {
    if (!this.authService.tieneRol(ROLES.CLIENTE)) {
      this.notif.aviso('Sin conexión, las reservas desde la tienda solo las puede hacer un cliente.');
      return;
    }
    if (!(await this.catOffline.disponible())) {
      this.notif.error('Sin conexión y sin datos guardados. Cuando tengas red, usa "Preparar modo offline" en Sincronización.', 'No se puede reservar');
      return;
    }
    this.sucursales = await this.catOffline.sucursalesConStock(
      this.items.map(i => ({ variante_id: i.variante_id, cantidad: i.cantidad })));
    if (this.sucursales.length === 0) {
      this.notif.aviso('Según los datos guardados, ninguna sucursal tiene stock para todo tu carrito.');
      return;
    }
    this.reservaOffline = true;
    this.mostrarModalReserva = true;
    this.cdr.detectChanges();
  }

  cerrarModalReserva() {
    this.mostrarModalReserva = false;
    this.fechaVisita = '';
    this.sucursalSeleccionada = 0;
  }

  async confirmarReservaEnSucursal() {
    if (!this.sucursalSeleccionada || !this.fechaVisita) {
      alert('Por favor, selecciona una sucursal y una fecha/hora.');
      return;
    }

    const usuario = this.authService.getUsuarioActual();

    if (this.reservaOffline) {
      this.guardando = true;
      try {
        await this.opsOffline.registrarReserva({
          sucursal_id: Number(this.sucursalSeleccionada),
          fecha_visita: this.fechaVisita,
          cliente_id: usuario?.id ?? null,
          items: this.items.map(i => ({ variante_id: i.variante_id, cantidad: i.cantidad, nombre: i.nombre, talla: i.talla, color: i.color })),
        });
        alert('Reserva guardada en tu dispositivo. Se enviará a la tienda cuando vuelva la conexión. Puedes ver su estado en "Sincronización".');
        this.cerrarModalReserva();
        this.limpiarDatosCarrito();
      } catch (e: any) {
        this.notif.error(e?.message ?? 'No se pudo guardar la reserva.');
      } finally {
        this.guardando = false;
        this.cdr.detectChanges();
      }
      return;
    }

    const payload = {
      // Hora local de la tienda, sin zona (contrato §6.2 "igual que POST /reservas"); toISOString() la pasaba a UTC.
      fecha_visita: fechaHoraLocalSinZona(this.fechaVisita),
      cliente_id: Number(usuario?.id),
      sucursal_id: Number(this.sucursalSeleccionada),
      detalles: this.items.map(item => ({
        variante_id: item.variante_id,
        cantidad: item.cantidad
      }))
    };

    this.reservaService.crearReserva(payload).subscribe({
      next: (res) => {
        alert(`¡Reserva confirmada! Tu código es #${res.id}. Te esperamos en la tienda.`);
        this.cerrarModalReserva();
        this.limpiarDatosCarrito();
      },
      error: (err) => {
        this.notif.errorHttp(err, 'No se pudo registrar la reserva.');
      }
    });
  }
}
