import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-reservas-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas.html'
})
export class ReservasAdminComponent implements OnInit {
  private reservaService = inject(ReservaService);
  private authService = inject(AuthService);

  reservas: any[] = [];
  sucursalId: number = 0;
  cargando: boolean = true;

  ngOnInit() {
    const usuario = this.authService.getUsuarioActual();
    this.sucursalId = usuario?.sucursal_id || 1; // Fallback a sucursal 1 si no hay
    this.cargarReservas();
  }

  cargarReservas() {
    this.cargando = true;
    this.reservaService.obtenerReservasSucursal(this.sucursalId).subscribe({
      next: (data) => {
        this.reservas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar reservas:', err);
        this.cargando = false;
      }
    });
  }

  cambiarEstado(reservaId: number, nuevoEstado: string) {
    if (confirm(`¿Marcar reserva como ${nuevoEstado}?`)) {
      this.reservaService.actualizarEstado(reservaId, nuevoEstado).subscribe({
        next: () => {
          this.cargarReservas(); // Recargamos para ver los cambios
        },
        error: (err) => alert('Error al cambiar el estado')
      });
    }
  }

  obtenerColorEstado(estado: string): string {
    switch(estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Preparada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completada': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}