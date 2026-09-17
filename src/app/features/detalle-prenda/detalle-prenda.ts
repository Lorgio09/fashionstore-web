import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../shared/services/carrito.service';

@Component({
  selector: 'app-detalle-prenda',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-prenda.html'
})
export class DetallePrendaComponent implements OnInit {
  prenda: any = null;
  cargando = true;

  // Nuevas variables para los datos reales
  variantes: any[] = [];
  coloresUnicos: string[] = [];
  tallasUnicas: string[] = [];
  stockDisponible: number = 0;

  tallaSeleccionada: string = '';
  colorSeleccionado: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private carritoService: CarritoService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(id);
    }
  }

  cargarDetalle(id: string) {
    // 1. Cargar la info base de la prenda
    this.http.get(`https://fashionstore-api-kedu.onrender.com/api/catalogo/${id}`).subscribe({
      next: (data: any) => {
        this.prenda = data;
        this.cargarVariantes(id); // Llamamos al paso 2
      },
      error: (err) => {
        console.error("Error al cargar la prenda", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarVariantes(id: string) {
    // 2. Cargar las variantes y calcular stock
    this.http.get(`https://fashionstore-api-kedu.onrender.com/api/catalogo/${id}/variantes`).subscribe({
      next: (data: any) => {
        this.variantes = data;
        
        // Filtramos para obtener colores y tallas sin repetir
        this.coloresUnicos = [...new Set(this.variantes.map(v => v.color))];
        this.tallasUnicas = [...new Set(this.variantes.map(v => v.talla))];
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar variantes", err)
    });
  }

  seleccionarColor(color: string) {
    this.colorSeleccionado = color;
    this.calcularStock();
  }

  seleccionarTalla(talla: string) {
    this.tallaSeleccionada = talla;
    this.calcularStock();
  }

  calcularStock() {
    // Verificamos si existe la combinación exacta de talla y color seleccionada
    if (this.colorSeleccionado && this.tallaSeleccionada) {
      const variante = this.variantes.find(v => v.color === this.colorSeleccionado && v.talla === this.tallaSeleccionada);
      this.stockDisponible = variante ? variante.stock : 0;
    } else {
      this.stockDisponible = 0;
    }
  }

agregarAlCarrito() {
    if (!this.colorSeleccionado || !this.tallaSeleccionada) return;

    // Buscamos el ID exacto de la variante seleccionada
    const variante = this.variantes.find(v => v.color === this.colorSeleccionado && v.talla === this.tallaSeleccionada);
    
    if (variante) {
      // Usamos agregarItem (el nombre real del método en el servicio)
      this.carritoService.agregarItem({
        prenda_id: this.prenda.id,
        variante_id: variante.id,
        nombre: this.prenda.nombre,
        talla: this.tallaSeleccionada,
        color: this.colorSeleccionado,
        precio: this.prenda.precio_base,
        cantidad: 1,
        imagen_url: this.prenda.imagen_url
      });

      alert('¡Prenda agregada a tu carrito!');
    }
  }
}