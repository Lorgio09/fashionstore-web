import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-colecciones',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './colecciones.html'
})
export class ColeccionesComponent implements OnInit {
  private notif = inject(NotificacionService);
  colecciones: any[] = [];
  nuevaColeccion = { nombre: '', descripcion: '' };
  cargando = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarColecciones();
  }

  cargarColecciones() {
    this.http.get(`${environment.apiUrl}/catalogo/colecciones`).subscribe({
      next: (data: any) => { 
        this.colecciones = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar colecciones", err)
    });
  }

  guardarColeccion() {
    if (!this.nuevaColeccion.nombre) return;
    
    this.cargando = true;
    this.http.post(`${environment.apiUrl}/catalogo/colecciones`, this.nuevaColeccion).subscribe({
      next: () => {
        this.cargarColecciones();
        this.nuevaColeccion = { nombre: '', descripcion: '' };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => { this.cargando = false; this.notif.errorHttp(err, 'Error al guardar la colección.'); this.cdr.detectChanges(); }
    });
  }
}