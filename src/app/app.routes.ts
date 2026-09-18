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
import { CheckoutComponent } from './features/checkout/checkout';
import { PuntoVentaComponent } from './features/admin/punto-venta/punto-venta';

export const routes: Routes = [
    { path: '', component: InicioComponent }, 
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'recuperar-password', component: RecuperarPasswordComponent },
    { path: 'prenda/:id', component: DetallePrendaComponent },
    { path: 'carrito', component: CarritoComponent },
    { path: 'checkout', component: CheckoutComponent },
    
    // ZONA DEL ADMINISTRADOR Y EMPLEADOS
    { 
        path: 'admin', 
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        // 1. Permitimos que TANTO el Admin (2) COMO el Encargado (3) entren al contenedor principal
        data: { roles: [2, 3] }, 
        children: [
            { 
                path: 'punto-venta', 
                component: PuntoVentaComponent,
                canActivate: [adminGuard],
                data: { roles: [4] } // Solo el Cajero
            },
            { 
                path: 'dashboard', 
                component: DashboardComponent,
                canActivate: [adminGuard],
                data: { roles: [2] } // Solo Admin
            },
            
            // --- Módulo de Inventario ---
            { 
                path: 'prendas', 
                component: ListarPrendasComponent,
                canActivate: [adminGuard],
                data: { roles: [2] } // Solo Admin
            },
            { 
                path: 'nueva-prenda', 
                component: CrearPrendaComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            { 
                path: 'editar-prenda/:id', 
                component: CrearPrendaComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            { 
                path: 'categorias-tallas', 
                component: GestionCategoriasComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            { 
                path: 'temporadas', 
                component: TemporadasComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            { 
                path: 'colecciones', 
                component: ColeccionesComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            
            // --- Operaciones Operativas (Aquí entra el Encargado) ---
            { 
                path: 'entrada-inventario', 
                component: EntradaInventarioComponent,
                canActivate: [adminGuard],
                data: { roles: [2, 3] } // Admin Y Encargado de sucursal
            },

            // --- Módulo Estructural ---
            { 
                path: 'proveedores', 
                component: GestionProveedoresComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            { 
                path: 'sucursales', 
                component: GestionSucursalesComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            { 
                path: 'gestion-usuarios', 
                component: GestionUsuariosComponent,
                canActivate: [adminGuard],
                data: { roles: [2] }
            },
            { 
                path: 'auditoria', 
                component: BitacoraComponent,
                canActivate: [adminGuard],
                data: { roles: [2] } // Solo Admin
            },
            
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];