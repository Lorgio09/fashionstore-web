import { Routes } from '@angular/router';

// Fíjate que al final de la ruta va el nombre exacto del archivo sin el ".ts"
import { InicioComponent } from './features/inicio/inicio';
import { LoginComponent } from './features/auth/login/login'; 
import { RegistroComponent } from './features/auth/registro/registro';
import { RecuperarPasswordComponent } from './features/auth/recuperar-password/recuperar-password';

export const routes: Routes = [
    { path: '', component: InicioComponent }, 
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'recuperar-password', component: RecuperarPasswordComponent },
    { path: '**', redirectTo: '' } 
];