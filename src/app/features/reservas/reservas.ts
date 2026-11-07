import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'
import { CommonModule } from '@angular/common';
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth';
import { SelectorSucursalComponent } from '../../shared/components/selector-sucursal/selector-sucursal';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-reservas-admin',
  standalone: true,
  imports: [CommonModule, SelectorSucursalComponent],
  templateUrl: './reservas.html'
})
export class ReservasAdminComponent implements OnInit {
  private notif = inject(NotificacionService);
  private reservaService = inject(ReservaService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  reservas: any[] = [];
  sucursalId: number = 0;
  cargando: boolean = true;

  ngOnInit() {
    // La sucursal llega desde <app-selector-sucursal> (sin "1" por defecto: los ids son de cada empresa).
    this.sucursalId = this.authService.usuario()?.sucursal_id ?? 0;
    this.cargando = false;
  }

  cambiarSucursal(id: number) {
    if (id === this.sucursalId && this.reservas.length) return;
    this.sucursalId = id;
    this.cargarReservas();
  }

  cargarReservas() {
    if (!this.sucursalId) return;
    this.cargando = true;
    this.reservaService.obtenerReservasSucursal(this.sucursalId).subscribe({
      next: (data) => {
        this.reservas = data;
        this.cargando = false;
        this.cdr.detectChanges(); // 2. Obligamos a Angular a mostrar la tabla
      },
      error: (err) => {
        console.error('Error al cargar reservas:', err);
        this.cargando = false;
        this.cdr.detectChanges(); // También actualizamos si hay error
      }
    });
  }

  cambiarEstado(reservaId: number, nuevoEstado: string) {
    if (confirm(`¿Marcar reserva como ${nuevoEstado}?`)) {
      this.reservaService.actualizarEstado(reservaId, nuevoEstado).subscribe({
        next: () => {
          this.cargarReservas(); // Recargamos para ver los cambios
        },
        error: (err) => this.notif.errorHttp(err, 'Error al cambiar el estado de la reserva.')
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