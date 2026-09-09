import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-listar-prendas',
  standalone: true,
  imports: [RouterLink], // Importante para que funcione el botón de "Nueva Prenda"
  templateUrl: './listar-prenda.html'
})
export class ListarPrendasComponent implements OnInit {
  prendas: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef // 2. Lo inyectamos en el constructor
  ) {}

  ngOnInit() {
    this.cargarPrendas();
  }

  cargarPrendas() {
    this.http.get('http://localhost:8000/api/catalogo/').subscribe({
      next: (data: any) => {
        this.prendas = data;
        this.cdr.detectChanges();
      },

    });
  }
}