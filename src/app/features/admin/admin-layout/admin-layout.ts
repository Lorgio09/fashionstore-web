import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayoutComponent {
  
  // 1. Inyectamos el Router aquí para poder usarlo
  constructor(private router: Router) {}

  // 2. Envolvemos las instrucciones en la función que llama tu botón
  cerrarSesion() {
  console.log("¡El botón sí funciona y llamó a la función!"); // <-- El chismoso
  
  localStorage.removeItem('token');
  console.log("Token eliminado. Redirigiendo al login..."); // <-- El chismoso 2
  
  this.router.navigate(['/login']).then(exito => {
    console.log("¿Pudo navegar?: ", exito);
  });
}
}