import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ScrollRevealDirective } from '../../shared/scroll-reveal';


@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink,ScrollRevealDirective],
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
  
  // Aquí guardaremos la lista de prendas que llegue del backend
  prendas: any[] = []; 

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      this.nombreUsuario = localStorage.getItem('usuarioNombre');
    }
    
    // Llamamos a la función apenas cargue el componente
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.http.get('http://localhost:8000/api/catalogo').subscribe({
      next: (datos: any) => {
        this.prendas = datos; // Guardamos los datos en nuestra variable
      },
      error: (error) => {
        console.error("Error al cargar el catálogo:", error);
      }
    });
  }

  cerrarSesion() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioNombre');
    }
    this.nombreUsuario = null; 
  }

  probarCandado() {
    this.http.get('http://localhost:8000/api/usuarios/perfil').subscribe({
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