import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ROLES } from '../../../core/models/sesion';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayoutComponent {
  public authService = inject(AuthService);
  /** Nombres de rol para el menú (permisos por rol_nombre, no por rol_id). */
  readonly R = ROLES;

  /** Aviso si la suscripción no está ACTIVA (vencida = solo lectura, contrato §5). */
  readonly avisoSuscripcion = computed(() => {
    const s = this.authService.suscripcion();
    if (!s || s.estado === 'ACTIVA') return null;
    const textos: Record<string, string> = {
      VENCIDA: 'La suscripción de tu empresa venció: el sistema queda en solo lectura hasta renovarla.',
      SUSPENDIDA: 'La suscripción de tu empresa está suspendida. Contacta al administrador de la plataforma.',
      PROGRAMADA: 'La suscripción de tu empresa aún no inicia.',
      SIN_SUSCRIPCION: 'Tu empresa no tiene una suscripción activa.',
    };
    return textos[s.estado] ?? `Estado de la suscripción: ${s.estado}`;
  });

  cerrarSesion() {
    this.authService.cerrarSesion();
  }
}
