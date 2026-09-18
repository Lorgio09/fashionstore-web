import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth'; // Ajusta la ruta si es necesario

// Interfaces para tipado estricto y evitar errores de compilación
export interface ItemCarrito {
  prenda_id: number;
  variante_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './punto-venta.html'
})
export class PuntoVentaComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  productosDisponibles: any[] = []; 
  carrito: ItemCarrito[] = [];
  total: number = 0;
  
  metodoPagoSeleccionado: string = 'EFECTIVO';
  procesando: boolean = false;
  sucursalId: number = 0;

  // URL base de tu API (ajusta la ruta principal según la tengas en FastAPI)
  private API_URL = 'https://fashionstore-api-kedu.onrender.com/api';

  ngOnInit() {
    const usuario = this.authService.getUsuarioActual();
    
    // Validamos que el cajero tenga una sucursal asignada en su sesión
    if (usuario && usuario.sucursal_id) {
      this.sucursalId = usuario.sucursal_id;
      this.cargarProductosStock();
    } else {
      console.warn('El usuario actual no tiene un sucursal_id definido.');
      // Fallback para pruebas locales si no tienes el sucursal_id en el localStorage aún
      this.sucursalId = 1; 
      this.cargarProductosStock();
    }
  }

  cargarProductosStock() {
    // Endpoint hipotético para traer el stock específico de esta sucursal
    this.http.get<any[]>(`${this.API_URL}/inventario/sucursal/${this.sucursalId}`).subscribe({
      next: (data) => this.productosDisponibles = data,
      error: (err) => console.error('Error cargando productos de la sucursal:', err)
    });
  }

  agregarAlCarrito(producto: any) {
    // Asumimos que el objeto 'producto' del backend trae prenda_id y variante_id
    const itemExistente = this.carrito.find(
      item => item.prenda_id === producto.prenda_id && item.variante_id === producto.variante_id
    );

    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.carrito.push({
        prenda_id: producto.prenda_id,
        variante_id: producto.variante_id,
        nombre: producto.nombre,
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
    this.total = this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  seleccionarMetodo(metodo: string) {
    this.metodoPagoSeleccionado = metodo;
  }

  confirmarVenta() {
    if (this.carrito.length === 0) return;

    this.procesando = true;

    // Estructura exacta que espera tu modelo VentaPresencialCreate en FastAPI
    const payloadVenta = {
      sucursal_id: this.sucursalId,
      metodo_pago: this.metodoPagoSeleccionado,
      total: this.total,
      items: this.carrito.map(item => ({
        prenda_id: item.prenda_id,
        variante_id: item.variante_id,
        cantidad: item.cantidad,
        precio: item.precio
      }))
    };

    this.http.post(`${this.API_URL}/checkout/presencial`, payloadVenta).subscribe({
      next: (res) => {
        alert('Venta registrada con éxito. Imprimiendo recibo...');
        this.carrito = [];
        this.calcularTotal();
        this.procesando = false;
        // Opcional: Recargar el stock para reflejar el descuento
        this.cargarProductosStock();
      },
      error: (err) => {
        alert('Error al registrar la venta. Verifique la conexión o el stock.');
        console.error(err);
        this.procesando = false;
      }
    });
  }
}