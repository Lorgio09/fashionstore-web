import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-listar-prendas',
  standalone: true,
  imports: [RouterLink], 
  templateUrl: './listar-prenda.html'
})
export class ListarPrendasComponent implements OnInit {
  prendas: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.cargarPrendas();
  }

  cargarPrendas() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/').subscribe({
      next: (data: any) => {
        this.prendas = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar prendas en la tabla:", err.message);
      }
    });
  }

  eliminarPrenda(id: number, nombre: string) {
    if (confirm(`¿Estás seguro de que deseas eliminar la prenda "${nombre}"?`)) {
      this.http.delete(`https://fashionstore-api-kedu.onrender.com/api/catalogo/${id}`).subscribe({
        next: () => {
          alert('Prenda eliminada correctamente');
          this.cargarPrendas(); // Recargamos la tabla para que desaparezca
        },
        error: (err) => console.error("Error al eliminar", err)
      });
    }
  }
}