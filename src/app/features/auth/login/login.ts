import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { NotificacionService } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  datosLogin = {
    email: '',
    password: ''
  };

  cargando = signal(false);
  error = signal<string | null>(null);

  iniciarSesion() {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.datosLogin.email.trim(), this.datosLogin.password).subscribe({
      next: () => {
        this.cargando.set(false);
        // Destino según rol_nombre (no rol_id: los ids cambian entre bases)
        this.router.navigateByUrl(this.auth.rutaInicio());
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        // 401: credenciales o usuario desactivado · 403: empresa suspendida (contrato §2)
        this.error.set(
          NotificacionService.detalle(err) ??
            (err.status === 401 ? 'Correo o contraseña incorrectos.' : 'No se pudo iniciar sesión. Intenta de nuevo.'),
        );
      }
    });
  }
}
