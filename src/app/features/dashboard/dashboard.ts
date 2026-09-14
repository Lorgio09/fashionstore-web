import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html' 
})
export class DashboardComponent implements OnInit {
  resumen = {
    total_prendas: 0,
    total_sucursales: 0,
    total_proveedores: 0,
    total_categorias: 0,
    stock_total: 0
  };
  cargando = true;

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object // ¡NUEVO! Identificador de plataforma
  ) {}

  ngOnInit() {
    // ¡NUEVO! Solo hacemos la petición si estamos en el navegador web
    if (isPlatformBrowser(this.platformId)) {
      this.cargarResumen();
    } else {
      // Si estamos en el servidor de Angular (SSR), simplemente dejamos de cargar
      this.cargando = false;
    }
  }

  cargarResumen() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/dashboard/resumen').subscribe({
      next: (data: any) => {
        this.resumen = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar el dashboard", err);
        this.cargando = false;
      }
    });
  }
}