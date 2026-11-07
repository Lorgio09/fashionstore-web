import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-entrada-inventario',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './entrada-inventario.html'
})
export class EntradaInventarioComponent implements OnInit {
  private notif = inject(NotificacionService);
  prendas: any[] = [];
  sucursales: any[] = [];
  
  nuevaEntrada = {
    prenda_id: null as number | null,
    talla: '',
    color: '',
    codigo_sku: '',
    sucursal_id: null as number | null,
    cantidad: 1
  };
  
  cargando = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPrendas();
    this.cargarSucursales();
  }

  cargarPrendas() {
    this.http.get(`${environment.apiUrl}/catalogo/`).subscribe({
      next: (data: any) => { 
        this.prendas = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar prendas", err)
    });
  }

  cargarSucursales() {
    this.http.get(`${environment.apiUrl}/catalogo/sucursales`).subscribe({
      next: (data: any) => { 
        this.sucursales = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar sucursales", err)
    });
  }

  guardarEntrada() {
    if (!this.nuevaEntrada.prenda_id || !this.nuevaEntrada.sucursal_id || !this.nuevaEntrada.talla || !this.nuevaEntrada.codigo_sku) {
      alert("Por favor, completa los campos obligatorios (Prenda, Sucursal, Talla y SKU).");
      return;
    }

    this.cargando = true;
    this.http.post(`${environment.apiUrl}/catalogo/variantes-stock`, this.nuevaEntrada).subscribe({
      next: () => {
        alert('¡Inventario registrado con éxito!');
        this.nuevaEntrada = { prenda_id: null, talla: '', color: '', codigo_sku: '', sucursal_id: null, cantidad: 1 };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notif.errorHttp(err, 'Error al registrar el inventario.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}