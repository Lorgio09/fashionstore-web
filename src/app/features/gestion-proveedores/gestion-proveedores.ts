import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-proveedores',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestion-proveedores.html'
})
export class GestionProveedoresComponent implements OnInit {
  proveedores: any[] = [];
  nuevoProveedor = { nombre: '' };
  cargando = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/proveedores').subscribe({
      next: (data: any) => {
        this.proveedores = data;
        this.cdr.detectChanges(); // 3. Despertar a Angular al cargar
      },
      error: (err) => console.error("Error", err)
    });
  }

  guardarProveedor() {
    if (!this.nuevoProveedor.nombre.trim()) return;
    
    this.cargando = true;
    this.http.post('https://fashionstore-api-kedu.onrender.com/api/catalogo/proveedores', this.nuevoProveedor).subscribe({
      next: () => {
        this.nuevoProveedor.nombre = ''; 
        this.cargarProveedores();         
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        alert('Error al guardar');
        this.cargando = false;
        this.cdr.detectChanges(); 
      }
    });
  }
}