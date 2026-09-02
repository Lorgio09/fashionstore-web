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
    this.http.post('http://localhost:8000/api/usuarios/login', this.datosLogin)
      .subscribe({
        next: (respuesta: any) => {
          localStorage.setItem('token', respuesta.access_token);
          localStorage.setItem('usuarioNombre', respuesta.usuario.nombre);
          alert('¡Bienvenido ' + respuesta.usuario.nombre + '!');
          this.router.navigate(['/']); 
        },
        error: (error) => {
          alert('Error: ' + error.error.detail);
        }
      });
  }
}