import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-sucursales',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestion-sucursales.html'
})
export class GestionSucursalesComponent implements OnInit {
  sucursales: any[] = [];
  nuevaSucursal = { nombre: '', direccion: '' };
  cargando = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarSucursales();
  }

  cargarSucursales() {
    // Si tu ruta en FastAPI es diferente, ajusta el enlace aquí:
    this.http.get('http://localhost:8000/api/catalogo/sucursales').subscribe({
      next: (data: any) => {
        this.sucursales = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar sucursales", err)
    });
  }

  guardarSucursal() {
    if (!this.nuevaSucursal.nombre.trim()) return;

    this.cargando = true;
    this.http.post('http://localhost:8000/api/catalogo/sucursales', this.nuevaSucursal).subscribe({
      next: () => {
        this.nuevaSucursal = { nombre: '', direccion: '' };
        this.cargarSucursales();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error al guardar la sucursal');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}