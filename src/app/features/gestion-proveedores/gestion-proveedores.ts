import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-gestion-proveedores',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestion-proveedores.html'
})
export class GestionProveedoresComponent implements OnInit {
  private notif = inject(NotificacionService);
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
    this.http.get(`${environment.apiUrl}/catalogo/proveedores`).subscribe({
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
    this.http.post(`${environment.apiUrl}/catalogo/proveedores`, this.nuevoProveedor).subscribe({
      next: () => {
        this.nuevoProveedor.nombre = ''; 
        this.cargarProveedores();         
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.notif.errorHttp(err, 'Error al guardar el proveedor.');
        this.cargando = false;
        this.cdr.detectChanges(); 
      }
    });
  }
}