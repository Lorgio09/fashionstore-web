import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router'; 
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ScrollRevealDirective } from '../../shared/scroll-reveal';
import { CarritoService } from '../../shared/services/carrito.service';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth';
import { ConexionService } from '../../core/services/conexion.service';
import { CatalogoOfflineService } from '../../core/services/catalogo-offline.service';
import { AvisoDatosOfflineComponent } from '../../shared/components/aviso-datos-offline/aviso-datos-offline';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective, CommonModule, AvisoDatosOfflineComponent],
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
  auth = inject(AuthService);
  private conexion = inject(ConexionService);
  private catOffline = inject(CatalogoOfflineService);
  /** El catálogo mostrado viene del dispositivo (sin red). */
  desdeDispositivo = false;
  /** Sin red y sin catálogo guardado. */
  sinDatosOffline = false;

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
    // Sesión centralizada en AuthService (usuario y empresa del login)
    this.nombreUsuario = this.auth.usuario()?.nombre ?? null;
  }

  cargarCatalogo() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.conexion.enLinea()) {
        this.cargarCatalogoLocal();
        return;
      }
      this.http.get(`${environment.apiUrl}/catalogo/agrupado/secciones`).subscribe({
        next: (datos: any) => {
          this.desdeDispositivo = false;
          this.mostrarSecciones(datos);
        },
        error: (error) => {
          // Sin respuesta del servidor: catálogo guardado en el dispositivo (si la sesión lo preparó).
          if (error?.status === 0) this.cargarCatalogoLocal();
          else console.error("Error al cargar las secciones:", error.message);
        }
      });
    }
  }

  /** Catálogo offline (§6.1): solo existe si el usuario con sesión preparó el dispositivo. */
  private async cargarCatalogoLocal() {
    if (!(await this.catOffline.disponible())) {
      this.sinDatosOffline = true;
      this.cdr.detectChanges();
      return;
    }
    this.desdeDispositivo = true;
    this.mostrarSecciones(await this.catOffline.seccionesTienda());
  }

  private mostrarSecciones(datos: any[]) {
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
    this.nombreUsuario = null;
    this.auth.cerrarSesion();
  }

  onImgLoad(event: Event) {
    const img = event.target as HTMLElement;
    img.classList.remove('opacity-0');
    img.classList.add('opacity-100');
  }
}