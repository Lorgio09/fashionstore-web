import { Injectable, effect, inject, untracked } from '@angular/core';
import { TiendaService } from '../../core/services/tienda.service';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  prenda_id: number;
  variante_id: number;
  nombre: string;
  precio: number;
  imagen_url: string;
  talla: string;
  color: string;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  // BehaviorSubject nos permite avisarle a otros componentes (como el navbar) cuando el carrito cambia
  private carrito = new BehaviorSubject<ItemCarrito[]>([]);
  carrito$ = this.carrito.asObservable();

  private tienda = inject(TiendaService);

  constructor() {
    // Un carrito por tienda: al cambiar de tienda se carga el de esa tienda.
    effect(() => {
      this.tienda.slug();
      untracked(() => this.cargarDelStorage());
    });
  }

  private get clave(): string {
    return `carrito_compras:${this.tienda.slug()}`;
  }

  /** Vacía el carrito de la tienda actual (después de comprar o reservar). */
  vaciar() {
    this.carrito.next([]);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(this.clave);
  }

  agregarItem(item: ItemCarrito) {
    const itemsActuales = this.carrito.getValue();
    
    // Buscamos si ya existe esta misma prenda con la misma talla y color en el carrito
    const itemExistente = itemsActuales.find(
      i => i.prenda_id === item.prenda_id && i.talla === item.talla && i.color === item.color
    );

    if (itemExistente) {
      // Si ya existe, solo sumamos la cantidad
      itemExistente.cantidad += 1;
      this.carrito.next([...itemsActuales]);
    } else {
      // Si es nueva, la agregamos a la lista
      this.carrito.next([...itemsActuales, item]);
    }

    this.guardarEnStorage();
  }

  private guardarEnStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.clave, JSON.stringify(this.carrito.getValue()));
    }
  }

  private cargarDelStorage() {
    if (typeof localStorage !== 'undefined') {
      const guardado = localStorage.getItem(this.clave);
      this.carrito.next(guardado ? JSON.parse(guardado) : []);
    }
  }
}