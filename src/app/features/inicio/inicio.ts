import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router'; 
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ScrollRevealDirective } from '../../shared/scroll-reveal';
import { CarritoService } from '../../shared/services/carrito.service';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective, CommonModule],
  styleUrl: './inicio.scss',
  templateUrl: './inicio.html',
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(24px)' }),
          stagger(80, [
            animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class InicioComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  
  nombreUsuario: string | null = null;
  cantidadCarrito: number = 0;

  // --- NUEVAS VARIABLES PARA LOS FILTROS ---
  seccionesOriginales: any[] = []; // Guarda el catálogo intacto
  seccionesAgrupadas: any[] = []; // Es lo que se dibuja en pantalla
  
  coloresDisponibles: string[] = ['Todos'];
  categoriaSeleccionada: string = 'Todas';
  colorSeleccionado: string = 'Todos';

  constructor(private http: HttpClient, private router: Router, private carritoService: CarritoService) {}

  ngOnInit() {
    this.verificarSesion(); 
    this.cargarCatalogo();
    this.carritoService.carrito$.subscribe(items => {
      this.cantidadCarrito = items.reduce((total, item) => total + item.cantidad, 0);
    });
  }

  verificarSesion() {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.nombreUsuario = payload.nombre; 
        } catch (e) {
          this.cerrarSesion();
        }
      }
    }
  }

  cargarCatalogo() {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/agrupado/secciones').subscribe({
        next: (datos: any) => {
          this.seccionesOriginales = datos; 
          this.seccionesAgrupadas = datos; 
          
          // Extraemos los colores únicos automáticamente
          const coloresSet = new Set<string>();
          datos.forEach((seccion: any) => {
            seccion.prendas.forEach((prenda: any) => {
              prenda.variantes?.forEach((variante: any) => {
                if (variante.color) coloresSet.add(variante.color);
              });
            });
          });
          
          this.coloresDisponibles = ['Todos', ...Array.from(coloresSet).sort()];
          this.cdr.detectChanges(); 
        },
        error: (error) => {
          console.error("Error al cargar las secciones:", error.message);
        }
      });
    }
  }

  // --- MOTOR MATEMÁTICO DE FILTRADO ---
  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    this.aplicarFiltros();
  }

  seleccionarColor(color: string) {
    this.colorSeleccionado = color;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let resultado = [];

    for (const seccion of this.seccionesOriginales) {
      // 1. Filtro por Categoría
      if (this.categoriaSeleccionada !== 'Todas' && seccion.nombre_seccion !== this.categoriaSeleccionada) {
        continue;
      }

      // 2. Filtro por Color
      const prendasFiltradas = seccion.prendas.filter((prenda: any) => {
        if (this.colorSeleccionado === 'Todos') return true;
        return prenda.variantes && prenda.variantes.some((v: any) => 
          v.color.toLowerCase() === this.colorSeleccionado.toLowerCase()
        );
      });

      // 3. Agregar si sobrevivieron prendas
      if (prendasFiltradas.length > 0) {
        resultado.push({
          ...seccion,
          prendas: prendasFiltradas
        });
      }
    }

    this.seccionesAgrupadas = resultado;
    this.cdr.detectChanges();
  }

  cerrarSesion() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.nombreUsuario = null; 
    this.router.navigate(['/login']); 
  }

  onImgLoad(event: Event) {
    const img = event.target as HTMLElement;
    img.classList.remove('opacity-0');
    img.classList.add('opacity-100');
  }
}