import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router'; // Añadimos Router
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ScrollRevealDirective } from '../../shared/scroll-reveal';
import { CarritoService } from '../../shared/services/carrito.service';
import { isPlatformBrowser,CommonModule } from '@angular/common';

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
  seccionesAgrupadas: any[] = []; // <-- Cambiamos 'prendas' por esta nueva variable
  cantidadCarrito: number = 0;

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
      // <-- Llamamos al nuevo endpoint seguro que agrupa por categorías
      this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/agrupado/secciones').subscribe({
        next: (datos: any) => {
          this.seccionesAgrupadas = datos; 
          this.cdr.detectChanges(); 
        },
        error: (error) => {
          console.error("Error al cargar las secciones:", error.message);
        }
      });
    } else {
      console.log('Omitiendo llamada a la API durante el renderizado del servidor.');
    }
  }

  cerrarSesion() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.nombreUsuario = null; 
    this.router.navigate(['/login']); 
  }

  probarCandado() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/usuarios/perfil').subscribe({
      next: (respuesta: any) => {
        alert(respuesta.mensaje);
      },
      error: (error) => {
        alert("Acceso denegado: " + error.error.detail);
      }
    });
  }

  onImgLoad(event: Event) {
    const img = event.target as HTMLElement;
    img.classList.remove('opacity-0');
    img.classList.add('opacity-100');
  }
}