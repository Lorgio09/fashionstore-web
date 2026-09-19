import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para los inputs (ngModel)
import { Router} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CarritoService, ItemCarrito } from '../../shared/services/carrito.service'; 

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html'
})
export class CheckoutComponent implements OnInit {
  items: ItemCarrito[] = [];
  total: number = 0;
  procesando: boolean = false;

  // Nuevas variables para atrapar el pago
  qrBase64: string | null = null;
  ordenId: number | null = null;

  cliente = {
    nombre: '', correo: '', telefono: '', direccion: ''
  };

  constructor(
    private carritoService: CarritoService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

simulando: boolean = false;

  simularPago() {
    if (!this.ordenId) return;
    this.simulando = true;
    
    this.http.post(`https://fashionstore-api-kedu.onrender.com/api/catalogo/checkout/${this.ordenId}/simular-pago`, {})
      .subscribe({
        next: () => {
          alert('¡Pago confirmado! El stock ha sido descontado y tu orden está en preparación.');
          window.location.href = '/'; 
        },
        error: (err) => {
          alert('Error al simular pago: ' + (err.error?.detail || 'Error desconocido'));
          this.simulando = false;
        }
      });
  }

  simularRechazo() {
    if (!this.ordenId) return;
    this.simulando = true;

    this.http.post(`https://fashionstore-api-kedu.onrender.com/api/catalogo/checkout/${this.ordenId}/simular-rechazo`, {})
      .subscribe({
        next: () => {
          alert('El pago ha sido rechazado. La orden fue cancelada.');
          window.location.href = '/'; // Volvemos al inicio
        },
        error: (err) => {
          alert('Error al simular rechazo: ' + (err.error?.detail || 'Error desconocido'));
          this.simulando = false;
        }
      });
  }

  ngOnInit() {
    this.carritoService.carrito$.subscribe(datos => {
      this.items = datos;
      this.total = this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    });

    if (this.items.length === 0 && !this.qrBase64) {
      this.router.navigate(['/']);
    }
  }

  confirmarCompra() {
    if (!this.cliente.nombre || !this.cliente.correo || !this.cliente.telefono) {
      alert('Por favor, completa todos los campos obligatorios (*)');
      return;
    }

    this.procesando = true;

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

    const API_URL = 'https://fashionstore-api-kedu.onrender.com/api/catalogo/checkout';

    this.http.post(API_URL, payload)
      .subscribe({
        next: (respuesta: any) => {
          this.procesando = false;
          
          if (respuesta.qr_imagen_base64) {
            // Guardamos el QR en memoria para que Angular lo dibuje
            this.qrBase64 = respuesta.qr_imagen_base64;
            this.ordenId = respuesta.orden_id;
            
            // Limpiamos el carrito local
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('carrito_compras');
            }

            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error("Error en la compra:", err);
          alert('Error al generar el pago: ' + (err.error?.detail || 'Intenta de nuevo.'));
          this.procesando = false;
          this.cdr.detectChanges();
        }
      });
  }

  pagarConStripe() {
    if (!this.cliente.nombre || !this.cliente.correo || !this.cliente.telefono) {
      alert('Por favor, completa todos los campos obligatorios (*)');
      return;
    }

    this.procesando = true;

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

    const STRIPE_API_URL = 'https://fashionstore-api-kedu.onrender.com/api/catalogo/checkout/stripe'; 

    this.http.post(STRIPE_API_URL, payload)
      .subscribe({
        next: (respuesta: any) => {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('carrito_compras');
          }
          // Stripe nos devuelve una URL segura, redirigimos físicamente al cliente allí
          window.location.href = respuesta.url_pago;
        },
        error: (err) => {
          console.error("Error en Stripe:", err);
          alert('Error al conectar con la pasarela de tarjetas.');
          this.procesando = false;
          this.cdr.detectChanges();
        }
      });
  }
}