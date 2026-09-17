import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../shared/services/carrito.service'; 

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
  items: ItemCarrito[] = [];
  total: number = 0;

  constructor(private carritoService: CarritoService) {}

  ngOnInit() {
    // Nos suscribimos para recibir los datos actualizados del carrito
    this.carritoService.carrito$.subscribe(datos => {
      this.items = datos;
      this.calcularTotal();
    });
  }

  calcularTotal() {
    this.total = this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  // Función básica para vaciar todo el carrito por ahora
  vaciarCarrito() {
    if (confirm('¿Estás seguro de vaciar tu carrito?')) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('carrito_compras');
      }
      window.location.reload(); // Recarga simple para limpiar la vista
    }
  }
}