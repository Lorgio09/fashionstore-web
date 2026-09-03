import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
    this.http.post('http://localhost:8000/api/auth/login', this.datosLogin).subscribe({
      next: (respuesta: any) => {
        const token = respuesta.access_token;
        localStorage.setItem('token', token); // Guardamos el token

        // Decodificamos el JWT para leer los datos internos (Payload)
        // atob() decodifica texto en Base64
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Redirección Inteligente
        if (payload.rol === 'admin' || payload.rol === 'administrador') {
          // Si es el dueño, lo mandamos al panel (por ahora directo al formulario)
          this.router.navigate(['/admin/nueva-prenda']); 
        } else {
          // Si es un cliente normal, lo mandamos al inicio
          this.router.navigate(['/']); 
        }
      },
      error: (err) => {
        alert('Credenciales incorrectas');
      }
    });
  }
}