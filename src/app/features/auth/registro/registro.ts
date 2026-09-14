import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule],
  styleUrl: './registro.scss',
  templateUrl: './registro.html',
})
export class RegistroComponent {
  // 1. Alineado exactamente con el esquema ClienteCreate de FastAPI (sin rol_id)
  datosRegistro = {
    nombre_completo: '',
    email: '',
    password: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  crearCuenta() {
    // 2. Ruta corregida apuntando exactamente al endpoint del cliente
    this.http.post('https://fashionstore-api-kedu.onrender.com/api/usuarios/registro/cliente', this.datosRegistro)
      .subscribe({
        next: (respuesta) => {
          alert('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          // Extraemos el detalle del error si FastAPI nos rechaza (ej. correo duplicado)
          const mensajeError = error.error?.detail || 'Ocurrió un error al registrarse';
          alert('Error: ' + mensajeError);
        }
      });
  }
}