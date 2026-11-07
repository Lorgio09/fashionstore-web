import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestion-usuarios.html'
})
export class GestionUsuariosComponent implements OnInit {
  private notif = inject(NotificacionService);
  usuarios: any[] = [];
  roles: any[] = [];
  sucursales: any[] = [];
  
  // Coincide con tu UsuarioCreate
  nuevoUsuario = {
    nombre_completo: '',
    email: '',
    password: '',
    telefono: '',
    rol_id: null as number | null,
    sucursal_id: null as number | null
  };
  
  cargando = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarRoles();
    this.cargarSucursales();
    this.cargarUsuarios();
  }

  cargarRoles() {
    this.http.get(`${environment.apiUrl}/usuarios/roles`).subscribe({
      next: (data: any) => { this.roles = data; this.cdr.detectChanges(); },
      error: (err) => console.error("Error al cargar roles", err)
    });
  }

  cargarSucursales() {
    this.http.get(`${environment.apiUrl}/catalogo/sucursales`).subscribe({
      next: (data: any) => { this.sucursales = data; this.cdr.detectChanges(); },
      error: (err) => console.error("Error al cargar sucursales", err)
    });
  }

  cargarUsuarios() {
    this.http.get(`${environment.apiUrl}/usuarios/`).subscribe({
      next: (data: any) => { this.usuarios = data; this.cdr.detectChanges(); },
      error: (err) => console.error("Error al cargar usuarios", err)
    });
  }

  guardarUsuario() {
    if (!this.nuevoUsuario.nombre_completo || !this.nuevoUsuario.email || !this.nuevoUsuario.password || !this.nuevoUsuario.rol_id) {
      alert("Por favor, completa los campos obligatorios (Nombre, Email, Password y Rol).");
      return;
    }

    this.cargando = true;
    this.http.post(`${environment.apiUrl}/usuarios/usuarios`, this.nuevoUsuario).subscribe({
      next: () => {
        alert('¡Empleado registrado con éxito!');
        this.cargarUsuarios(); 
        this.nuevoUsuario = { nombre_completo: '', email: '', password: '', telefono: '', rol_id: null, sucursal_id: null };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notif.errorHttp(err, 'Error al registrar el usuario.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}