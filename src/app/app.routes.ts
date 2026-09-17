import { Routes } from '@angular/router';

import { InicioComponent } from './features/inicio/inicio';
import { LoginComponent } from './features/auth/login/login'; 
import { RegistroComponent } from './features/auth/registro/registro';
import { RecuperarPasswordComponent } from './features/auth/recuperar-password/recuperar-password';
import { CrearPrendaComponent } from './features/admin/crear-prenda/crear-prenda';
import { adminGuard } from './core/guards/admin-guard';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout'; 
import { ListarPrendasComponent } from './features/admin/listar-prenda/listar-prenda';
import { GestionCategoriasComponent } from './features/gestion-categorias/gestion-categorias';
import { GestionProveedoresComponent } from './features/gestion-proveedores/gestion-proveedores';
import { GestionSucursalesComponent } from './features/gestion-sucursales/gestion-sucursales';
import { EntradaInventarioComponent } from './features/entrada-inventario/entrada-inventario';
import { GestionUsuariosComponent } from './features/gestion-usuarios/gestion-usuarios';
import { BitacoraComponent } from './features/bitacora/bitacora';
import { TemporadasComponent } from './features/temporadas/temporadas';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ColeccionesComponent } from './features/colecciones/colecciones';
import { DetallePrendaComponent } from './features/detalle-prenda/detalle-prenda';
import { CarritoComponent } from './features/carrito/carrito';

export const routes: Routes = [
    { path: '', component: InicioComponent }, 
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'recuperar-password', component: RecuperarPasswordComponent },
    { path: 'prenda/:id', component: DetallePrendaComponent },
    { path: 'login', component: LoginComponent },
    {path: 'carrito', component: CarritoComponent},
    
    // ZONA DEL ADMINISTRADOR
    { 
        path: 'admin', 
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            
            // Inventario
            { path: 'prendas', component: ListarPrendasComponent },
            { path: 'nueva-prenda', component: CrearPrendaComponent },
            { path: 'editar-prenda/:id', component: CrearPrendaComponent },
            { path: 'categorias-tallas', component: GestionCategoriasComponent },
            { path: 'proveedores', component: GestionProveedoresComponent },
            { path: 'sucursales', component: GestionSucursalesComponent },
            { path: 'entrada-inventario', component: EntradaInventarioComponent },
            { path: 'gestion-usuarios', component: GestionUsuariosComponent },
            { path: 'auditoria', component: BitacoraComponent },
            { path: 'temporadas', component: TemporadasComponent },
            { path: 'colecciones', component: ColeccionesComponent },
            
            // Ahora sí, la redirección por defecto funcionará
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];