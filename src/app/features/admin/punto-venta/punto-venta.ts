import { Component, OnInit, inject,PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './punto-venta.html'
})
export class PuntoVentaComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  productosDisponibles: any[] = []; 
  carrito: ItemCarrito[] = [];
  total: number = 0;
  
  metodoPagoSeleccionado: string = 'EFECTIVO';
  procesando: boolean = false;
  sucursalId: number = 0;
  qrGenerado: string | null = null; // Guardará el QR del BCP

  private API_URL = 'https://fashionstore-api-kedu.onrender.com/api';

  ngOnInit() {
    // 1. Evitamos el error 429 de Render asegurándonos de que esto solo corra en el navegador del usuario
    if (isPlatformBrowser(this.platformId)) {
      const usuario = this.authService.getUsuarioActual();
      
      if (usuario && usuario.sucursal_id) {
        this.sucursalId = usuario.sucursal_id;
      } else {
        this.sucursalId = 1; 
      }
      this.cargarProductosStock();
    }
  }

  cargarProductosStock() {
    this.http.get<any[]>(`${this.API_URL}/catalogo/`).subscribe({
      next: (data) => {
        console.log("¡DATOS RECIBIDOS DEL BACKEND! ->", data); // <-- RASTREADOR: Veremos esto en la consola (F12)
        
        this.productosDisponibles = [];
        
        if (!data || data.length === 0) {
           console.warn("El backend respondió correctamente, pero mandó una lista vacía [].");
           return;
        }

        data.forEach(prenda => {
          if (prenda.variantes && prenda.variantes.length > 0) {
            prenda.variantes.forEach((variante: any) => {
              this.productosDisponibles.push({
                prenda_id: prenda.id,
                variante_id: variante.id,
                nombre: prenda.nombre,
                precio: prenda.precio_base,
                imagen_url: prenda.imagen_url,
                talla: variante.talla,
                color: variante.color
              });
            });
          }
        });
      },
      error: (err) => {
        console.error('ERROR CRÍTICO AL CARGAR CATÁLOGO:', err);
      }
    });
  }

  agregarAlCarrito(producto: any) {
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
    this.qrGenerado = null; // Limpiamos el QR si cambia de método
  }

  limpiarCaja() {
    this.carrito = [];
    this.calcularTotal();
    this.qrGenerado = null;
    this.cargarProductosStock();
  }

  confirmarVenta() {
    if (this.carrito.length === 0) return;
    this.procesando = true;
    this.qrGenerado = null;

    // 1. LÓGICA PARA EFECTIVO (Rápido y descuenta stock en caja)
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

      this.http.post(`${this.API_URL}/checkout/presencial`, payloadEfectivo).subscribe({
        next: () => {
          alert('Venta en Efectivo registrada con éxito. Imprimiendo recibo...');
          this.limpiarCaja();
          this.procesando = false;
        },
        error: (err) => {
          alert('Error al registrar la venta en efectivo.');
          console.error(err);
          this.procesando = false;
        }
      });
    } 
    
    // 2. LÓGICA PARA QR (Reutilizando el endpoint web del BCP)
    else if (this.metodoPagoSeleccionado === 'QR') {
      const payloadQR = {
        nombre_cliente: "Cliente en Caja",       // Dato fantasma obligatorio
        correo_cliente: "caja@fashionstore.com", // Dato fantasma obligatorio
        telefono_cliente: "00000000",            // Dato fantasma obligatorio
        direccion_envio: "Retiro en Sucursal",   // Dato fantasma obligatorio
        items: this.carrito.map(item => ({
          prenda_id: item.prenda_id,
          variante_id: item.variante_id,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      };

      this.http.post(`${this.API_URL}/checkout`, payloadQR).subscribe({
        next: (res: any) => {
          // Atrapamos la imagen del QR para mostrarla en pantalla
          this.qrGenerado = res.qr_imagen_base64;
          this.procesando = false;
          // NOTA: No limpiamos la caja aún para que el cajero y el cliente puedan ver el QR en pantalla
        },
        error: (err) => {
          alert('Error al generar el QR con el BCP.');
          console.error(err);
          this.procesando = false;
        }
      });
    }
  }
}