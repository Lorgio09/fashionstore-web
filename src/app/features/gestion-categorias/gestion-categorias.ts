import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-categorias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestion-categorias.html'
})
export class GestionCategoriasComponent implements OnInit {
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
    this.http.get('http://localhost:8000/api/catalogo/categorias').subscribe({
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
    this.http.post('http://localhost:8000/api/catalogo/categorias', this.nuevaCategoria).subscribe({
      next: () => {
        this.nuevaCategoria.nombre = ''; 
        this.cargarCategorias();         
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        alert('Error al guardar la categoría');
        this.cargando = false;
        this.cdr.detectChanges(); 
      }
    });
  }
}