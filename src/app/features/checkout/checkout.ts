import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para los inputs (ngModel)
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CarritoService, ItemCarrito } from '../../shared/services/carrito.service'; 

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html'
})
export class CheckoutComponent implements OnInit {
  items: ItemCarrito[] = [];
  total: number = 0;
  procesando: boolean = false;

  // Molde para los datos del cliente
  cliente = {
    nombre: '',
    correo: '',
    telefono: '',
    direccion: ''
  };

  constructor(
    private carritoService: CarritoService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.carritoService.carrito$.subscribe(datos => {
      this.items = datos;
      this.total = this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    });

    // Si el carrito está vacío, lo devolvemos a la tienda
    if (this.items.length === 0) {
      this.router.navigate(['/']);
    }
  }

  confirmarCompra() {
    if (!this.cliente.nombre || !this.cliente.correo || !this.cliente.telefono) {
      alert('Por favor, completa todos los campos obligatorios (*)');
      return;
    }

    this.procesando = true;

    // Empacamos los datos exactamente como los espera FastAPI (Pydantic: OrdenCreate)
    const payload = {
      nombre_cliente: this.cliente.nombre,
      correo_cliente: this.cliente.correo,
      telefono_cliente: this.cliente.telefono,
      direccion_envio: this.cliente.direccion,
      items: this.items.map(item => ({
        prenda_id: item.prenda_id,
        variante_id: item.variante_id,
        cantidad: item.cantidad,
        precio: item.precio
      }))
    };

    // Enviamos la petición al endpoint que acabas de crear
    this.http.post('https://fashionstore-api-kedu.onrender.com/api/catalogo/checkout', payload)
      .subscribe({
        next: (respuesta: any) => {
          alert('¡Compra exitosa! Tu número de orden es: ' + respuesta.orden_id);
          
          // Limpiamos la memoria del navegador
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('carrito_compras');
          }
          
          // Redirigimos al inicio recargando para limpiar los estados
          window.location.href = '/';
        },
        error: (err) => {
          console.error("Error en la compra:", err);
          alert('Error al procesar la compra: ' + (err.error?.detail || 'Intenta de nuevo más tarde'));
          this.procesando = false;
        }
      });
  }
}