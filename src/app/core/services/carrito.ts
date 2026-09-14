import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  prenda_id: number;
  variante_id: number;
  nombre: string;
  talla: string;
  color: string;
  precio: number;
  cantidad: number;
  imagen_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  // BehaviorSubject nos permite observar los cambios en tiempo real
  private itemsCarrito = new BehaviorSubject<ItemCarrito[]>([]);
  items$ = this.itemsCarrito.asObservable();

  constructor() {}

  agregarAlCarrito(item: ItemCarrito) {
    const itemsActuales = this.itemsCarrito.getValue();
    
    // Buscamos si ya existe exactamente la misma prenda con misma talla y color
    const index = itemsActuales.findIndex(i => i.variante_id === item.variante_id);
    
    if (index > -1) {
      itemsActuales[index].cantidad += item.cantidad;
      this.itemsCarrito.next([...itemsActuales]);
    } else {
      this.itemsCarrito.next([...itemsActuales, item]);
    }
  }

  obtenerTotal(): number {
    return this.itemsCarrito.getValue().reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  limpiarCarrito() {
    this.itemsCarrito.next([]);
  }
}