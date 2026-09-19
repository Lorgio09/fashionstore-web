import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel en el modal
import { CarritoService, ItemCarrito } from '../../shared/services/carrito.service'; 
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth'; 
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
  private http = inject(HttpClient);
  private carritoService = inject(CarritoService);
  private reservaService = inject(ReservaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  items: ItemCarrito[] = [];
  total: number = 0;

  // Variables para el Modal de Reserva
  mostrarModalReserva: boolean = false;
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
    
    // 1. Armamos lo que vamos a consultar al backend
    const payloadCheck = this.items.map(item => ({
      variante_id: item.variante_id,
      cantidad: item.cantidad
    }));

    // 2. Llamamos al nuevo endpoint filtrador
    this.http.post<any[]>('https://fashionstore-api-kedu.onrender.com/api/catalogo/sucursales-disponibles', payloadCheck).subscribe({
      next: (sucursalesValidas) => {
        this.sucursales = sucursalesValidas;
        
        // Si el backend devuelve una lista vacía, significa que el pedido no se puede cumplir en ninguna tienda
        if (this.sucursales.length === 0) {
           alert("Lo sentimos, ninguna sucursal tiene stock suficiente para todas las prendas de tu carrito juntas.");
           return;
        }

        // Si hay sucursales disponibles, recién abrimos el modal
        this.mostrarModalReserva = true;
      },
      error: (err) => {
        console.error("Error validando sucursales:", err);
        alert("Ocurrió un error al verificar la disponibilidad en tiendas.");
      }
    });
  }

  cerrarModalReserva() {
    this.mostrarModalReserva = false;
    this.fechaVisita = '';
    this.sucursalSeleccionada = 0;
  }

  confirmarReservaEnSucursal() {
    if (!this.sucursalSeleccionada || !this.fechaVisita) {
      alert('Por favor, selecciona una sucursal y una fecha/hora.');
      return;
    }

    const usuario = this.authService.getUsuarioActual();

    const payload = {
      fecha_visita: new Date(this.fechaVisita).toISOString(),
      cliente_id: Number(usuario.sub || usuario.id || usuario.usuario_id),
      sucursal_id: Number(this.sucursalSeleccionada),
      detalles: this.items.map(item => ({
        variante_id: item.variante_id,
        cantidad: item.cantidad
      }))
    };

    console.log("PAQUETE ENVIADO A FASTAPI:", payload);
    this.reservaService.crearReserva(payload).subscribe({
      next: (res) => {
        alert(`¡Reserva confirmada! Tu código es #${res.id}. Te esperamos en la tienda.`);
        this.cerrarModalReserva();
        this.limpiarDatosCarrito(); 
      },
      error: (err) => {
        // ATRAPAMOS EL MENSAJE EXACTO DE FASTAPI
        console.error("ERROR 422 COMPLETO:", err);
        const detalle = err.error?.detail;
        
        // FastAPI devuelve un arreglo detallando qué campo falló
        const mensajeExacto = typeof detalle === 'object' ? JSON.stringify(detalle) : detalle;
        alert(`FastAPI rechazó los datos (422). Detalle: ${mensajeExacto}`);
      }
    });
  }
}