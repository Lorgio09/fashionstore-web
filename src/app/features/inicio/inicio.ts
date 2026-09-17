import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router'; // Añadimos Router
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ScrollRevealDirective } from '../../shared/scroll-reveal';
import { CarritoService } from '../../shared/services/carrito.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
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
  nombreUsuario: string | null = null;
  prendas: any[] = []; 
  cantidadCarrito: number = 0;

  // Inyectamos el Router para poder redireccionar al cerrar sesión
  constructor(private http: HttpClient, private router: Router, private carritoService: CarritoService) {}

  ngOnInit() {
    this.verificarSesion(); 
    this.cargarCatalogo();
    this.carritoService.carrito$.subscribe(items => {
      // Suma la cantidad total de prendas
      this.cantidadCarrito = items.reduce((total, item) => total + item.cantidad, 0);
    });
  }

  // Nueva función que lee y decodifica el JWT
  verificarSesion() {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decodificamos el payload del JWT
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.nombreUsuario = payload.nombre; // Extraemos el nombre que guardó FastAPI
        } catch (e) {
          this.cerrarSesion();
        }
      }
    }
  }

  cargarCatalogo() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/').subscribe({
      next: (datos: any) => {
        this.prendas = datos; 
      },
      error: (error) => {
        console.error("Error al cargar el catálogo:", error);
      }
    });
  }

  cerrarSesion() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.nombreUsuario = null; 
    this.router.navigate(['/login']); // Redireccionamos al login
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