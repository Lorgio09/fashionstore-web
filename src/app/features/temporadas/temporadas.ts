import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-temporadas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './temporadas.html'
})
export class TemporadasComponent implements OnInit {
  temporadas: any[] = [];
  nuevaTemporada = {
    nombre: '',
    fecha_inicio: null,
    fecha_fin: null
  };
  cargando = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarTemporadas();
  }

  cargarTemporadas() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/temporadas').subscribe({
      next: (data: any) => { 
        this.temporadas = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar temporadas", err)
    });
  }

  guardarTemporada() {
    if (!this.nuevaTemporada.nombre) {
      alert("El nombre de la temporada es obligatorio.");
      return;
    }

    this.cargando = true;
    this.http.post('https://fashionstore-api-kedu.onrender.com/api/catalogo/temporadas', this.nuevaTemporada).subscribe({
      next: () => {
        alert('¡Temporada registrada con éxito!');
        this.cargarTemporadas();
        this.nuevaTemporada = { nombre: '', fecha_inicio: null, fecha_fin: null };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error al registrar la temporada.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}