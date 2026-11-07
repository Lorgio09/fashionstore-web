import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-gestion-categorias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestion-categorias.html'
})
export class GestionCategoriasComponent implements OnInit {
  private notif = inject(NotificacionService);
  categorias: any[] = [];
  nuevaCategoria = { nombre: '' };
  cargando = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.http.get(`${environment.apiUrl}/catalogo/categorias`).subscribe({
      next: (data: any) => {
        this.categorias = data;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar", err)
    });
  }

  guardarCategoria() {
    if (!this.nuevaCategoria.nombre.trim()) {
      alert("El nombre de la categoría no puede estar vacío");
      return;
    }
    
    this.cargando = true;
    this.http.post(`${environment.apiUrl}/catalogo/categorias`, this.nuevaCategoria).subscribe({
      next: () => {
        this.nuevaCategoria.nombre = ''; 
        this.cargarCategorias();         
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.notif.errorHttp(err, 'Error al guardar la categoría.');
        this.cargando = false;
        this.cdr.detectChanges(); 
      }
    });
  }
}