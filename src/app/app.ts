import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacionesComponent } from './shared/components/notificaciones/notificaciones';
import { IndicadorConexionComponent } from './shared/components/indicador-conexion/indicador-conexion';
import { PwaService } from './core/services/pwa.service';
import { SincronizacionService } from './core/sync/sincronizacion.service';
import { IconoComponent } from './shared/components/icono/icono';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IconoComponent, RouterOutlet, NotificacionesComponent, IndicadorConexionComponent],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('fashionstore-web');
  protected pwa = inject(PwaService);
  private sync = inject(SincronizacionService);

  constructor() {
    // Abre IndexedDB y, ya lista, arranca la sincronización automática (al volver la red y cada 60 s).
    this.pwa.iniciar().then(() => this.sync.iniciar());
  }
}
