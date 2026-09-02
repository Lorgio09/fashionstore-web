import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- Para leer los inputs
import { HttpClient } from '@angular/common/http'; // <-- Para enviar datos

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule], // <-- Agregamos FormsModule
  styleUrl: './registro.scss',
  templateUrl: './registro.html',
})
export class RegistroComponent {
  // Objeto donde guardaremos lo que el usuario escriba
  datosRegistro = {
    nombre_completo: '',
    email: '',
    password: '',
    rol_id: 1 // Suponiendo que el rol 1 es para "Cliente"
  };

  constructor(private http: HttpClient, private router: Router) {}

  // Esta función se ejecuta al hacer clic en "Crear cuenta"
  crearCuenta() {
    this.http.post('http://localhost:8000/api/usuarios/registro', this.datosRegistro)
      .subscribe({
        next: (respuesta) => {
          alert('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
          this.router.navigate(['/login']); // Redirigimos al login
        },
        error: (error) => {
          // Si el correo ya existe, mostramos el error de FastAPI
          alert('Error: ' + error.error.detail);
        }
      });
  }
}