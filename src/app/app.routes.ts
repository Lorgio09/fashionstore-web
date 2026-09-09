import { Routes } from '@angular/router';

import { InicioComponent } from './features/inicio/inicio';
import { LoginComponent } from './features/auth/login/login'; 
import { RegistroComponent } from './features/auth/registro/registro';
import { RecuperarPasswordComponent } from './features/auth/recuperar-password/recuperar-password';
import { CrearPrendaComponent } from './features/admin/crear-prenda/crear-prenda';
import { adminGuard } from './core/guards/admin-guard';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout'; 
import { ListarPrendasComponent } from './features/admin/listar-prenda/listar-prenda';

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
            { path: 'prendas', component: ListarPrendasComponent },
            
            { path: 'nueva-prenda', component: CrearPrendaComponent },
            
            { path: '', redirectTo: 'prendas', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];