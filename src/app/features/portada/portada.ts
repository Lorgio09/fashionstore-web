import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { PublicoService } from '../../core/services/publico.service';
import { PlanPublico, TiendaPublica } from '../../core/models/publico';
import { numero } from '../../shared/utils/formato';
import { IconoComponent } from '../../shared/components/icono/icono';

/** Portada de FashionStore como plataforma SaaS: qué ofrece, planes y directorio de tiendas (§2.1). */
@Component({
  selector: 'app-portada',
  standalone: true,
  imports: [IconoComponent, RouterLink],
  templateUrl: './portada.html',
})
export class PortadaComponent implements OnInit {
  private publico = inject(PublicoService);
  auth = inject(AuthService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tiendas = signal<TiendaPublica[] | null>(null);
  readonly planes = signal<PlanPublico[] | null>(null);
  readonly errorTiendas = signal(false);
  readonly numero = numero;

  readonly funciones = [
    { icono: 'bolsa' as const, titulo: 'Tienda en línea propia', texto: 'Cada empresa vende con su nombre: catálogo por sucursal, carrito, reservas y pagos con QR o tarjeta.' },
    { icono: 'rayo' as const, titulo: 'Punto de venta sin conexión', texto: 'La caja sigue vendiendo aunque se caiga internet y sincroniza sola al volver la red, con control de conflictos.' },
    { icono: 'chispa' as const, titulo: 'Reportes con IA', texto: 'Pide un reporte con tus palabras, por texto o por voz, y recibe tabla, gráfico y resumen en PDF o Excel.' },
    { icono: 'grafico' as const, titulo: 'Analítica con Machine Learning', texto: 'Predicción de demanda, alertas de reposición y segmentos de clientes entrenados con los datos de cada empresa.' },
  ];

  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.publico.tiendas().subscribe({
      next: (l) => this.tiendas.set(l),
      error: () => { this.tiendas.set([]); this.errorTiendas.set(true); },
    });
    this.publico.planes().subscribe({ next: (l) => this.planes.set(l), error: () => this.planes.set([]) });
  }

  inicial(nombre: string): string {
    return (nombre.trim()[0] ?? '?').toUpperCase();
  }
}
