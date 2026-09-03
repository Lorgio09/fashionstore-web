import { Routes } from '@angular/router';

import { InicioComponent } from './features/inicio/inicio';
import { LoginComponent } from './features/auth/login/login'; 
import { RegistroComponent } from './features/auth/registro/registro';
import { RecuperarPasswordComponent } from './features/auth/recuperar-password/recuperar-password';
import { CrearPrendaComponent } from './features/admin/crear-prenda/crear-prenda';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
    { path: '', component: InicioComponent }, 
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'recuperar-password', component: RecuperarPasswordComponent },
    
    // Aquí dejamos nuestra ruta protegida, antes del comodín
    { 
        path: 'admin/nueva-prenda', 
        component: CrearPrendaComponent,
        canActivate: [adminGuard]
    },

    // El comodín asume su lugar obligatorio al final de la lista
    { path: '**', redirectTo: '' }
];