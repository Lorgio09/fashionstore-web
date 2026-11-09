import { Component, inject } from '@angular/core';
import { TiendaService } from '../../../core/services/tienda.service';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { NotificacionService } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule],
  styleUrl: './registro.scss',
  templateUrl: './registro.html',
})
export class RegistroComponent {
  /** Tienda actual: nombre y enlaces relativos a /tienda/:slug. */
  tienda = inject(TiendaService);
  private _asegurarTienda = this.tienda.asegurar();
  private notif = inject(NotificacionService);
  // 1. Alineado exactamente con el esquema ClienteCreate de FastAPI (sin rol_id)
  datosRegistro = {
    nombre_completo: '',
    email: '',
    password: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  crearCuenta() {
    // 2. Ruta corregida apuntando exactamente al endpoint del cliente
    this.http.post(`${environment.apiUrl}/usuarios/registro/cliente`, this.datosRegistro)
      .subscribe({
        next: (respuesta) => {
          alert('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          // Extraemos el detalle del error si FastAPI nos rechaza (ej. correo duplicado)
          this.notif.errorHttp(error, 'Ocurrió un error al registrarse.');
        }
      });
  }
}