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

export const routes: Routes = [
    { path: '', component: InicioComponent }, 
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'recuperar-password', component: RecuperarPasswordComponent },
    
    // ZONA DEL ADMINISTRADOR
    { 
        path: 'admin', 
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
            // Inventario
            { path: 'prendas', component: ListarPrendasComponent },
            { path: 'nueva-prenda', component: CrearPrendaComponent },
            { path: 'editar-prenda/:id', component: CrearPrendaComponent },
            { path: 'categorias-tallas', component: GestionCategoriasComponent },
            { path: 'proveedores', component: GestionProveedoresComponent },
            { path: 'sucursales', component: GestionSucursalesComponent },
            { path: 'entrada-inventario', component: EntradaInventarioComponent },
            
            // Administración (Las crearemos después)
            // { path: 'proveedores', component: GestionProveedoresComponent },
            
            { path: '', redirectTo: 'prendas', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];