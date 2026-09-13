import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Necesario para el pipe de fecha (date)

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bitacora.html'
})
export class BitacoraComponent implements OnInit {
  registros: any[] = [];
  cargando = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarBitacora();
  }

  cargarBitacora() {
    this.http.get('http://localhost:8000/api/auditoria/').subscribe({
      next: (data: any) => { 
        this.registros = data; 
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al cargar la bitácora", err);
        this.cargando = false;
      }
    });
  }

  // Pequeña ayuda visual para ponerle colores a las acciones
  obtenerColorAccion(accion: string): string {
    switch (accion.toUpperCase()) {
      case 'INSERTAR': return 'bg-green-100 text-green-800';
      case 'MODIFICAR': return 'bg-blue-100 text-blue-800';
      case 'ELIMINAR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}