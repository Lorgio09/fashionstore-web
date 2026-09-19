import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel en el modal
import { CarritoService, ItemCarrito } from '../../shared/services/carrito.service'; 
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
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
  
  // Opciones de sucursales (Puedes reemplazarlo luego llamando a un endpoint de sucursales)
  sucursales: any[] = [
    { id: 1, nombre: 'Sucursal Central - Santa Cruz' },
    { id: 2, nombre: 'Sucursal Norte - Santa Cruz' }
  ];

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
    // Verificamos si el usuario está logueado antes de dejarle reservar
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) {
      alert('Debes iniciar sesión para poder reservar prendas.');
      this.router.navigate(['/login']); // Ajusta a tu ruta de login
      return;
    }
    
    this.mostrarModalReserva = true;
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
      cliente_id: Number(usuario.sub),
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
        this.limpiarDatosCarrito(); // Vaciamos el carrito tras reservar exitosamente
      },
      error: (err) => {
        console.error(err);
        alert('Error al procesar la reserva. Verifica que haya stock suficiente en la sucursal elegida.');
      }
    });
  }
}