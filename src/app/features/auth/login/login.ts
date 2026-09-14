import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  datosLogin = {
    email: '',
    password: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  iniciarSesion() {
    this.http.post('https://fashionstore-api-kedu.onrender.com/api/usuarios/login', this.datosLogin).subscribe({
      next: (respuesta: any) => {
        const token = respuesta.access_token;
        localStorage.setItem('token', token); // Guardamos el token

        // Decodificamos el JWT para leer los datos internos (Payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Ahora verificamos el número 2, que es el rol_id de tu administrador en la base de datos
        if (payload.rol === 2) {
          // Si es el administrador, lo mandamos al panel
          this.router.navigate(['/admin/dashboard']); 
        } else {
          // Si es un cliente normal (ej. rol 1), lo mandamos al inicio
          this.router.navigate(['/']); 
        }
      },
      error: (err) => {
        alert('Credenciales incorrectas');
      }
    });
  }
}