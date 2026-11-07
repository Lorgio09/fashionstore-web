import { Routes } from '@angular/router';
import { ROLES } from './core/models/sesion';

import { InicioComponent } from './features/inicio/inicio';
import { LoginComponent } from './features/auth/login/login'; 
import { RegistroComponent } from './features/auth/registro/registro';
import { RecuperarPasswordComponent } from './features/auth/recuperar-password/recuperar-password';
import { CrearPrendaComponent } from './features/admin/crear-prenda/crear-prenda';
import { rolGuard, inicioPorRolGuard } from './core/guards/admin-guard';
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
import { ReservasAdminComponent } from './features/reservas/reservas';
import { MiPlanComponent } from './features/mi-plan/mi-plan';
import { PlataformaLayoutComponent } from './features/plataforma/plataforma-layout/plataforma-layout';
import { PlataformaEmpresasComponent } from './features/plataforma/empresas/empresas';
import { PlataformaEmpresaDetalleComponent } from './features/plataforma/empresa-detalle/empresa-detalle';
import { PlataformaPlanesComponent } from './features/plataforma/planes/planes';

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
        canActivate: [rolGuard],
        // 1. Permitimos que TANTO el Admin (2) COMO el Encargado (3) entren al contenedor principal
        data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] }, 
        children: [
            { 
                path: 'punto-venta', 
                component: PuntoVentaComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] } // Caja: Cajero, Encargado y Admin
            },
            { 
                path: 'dashboard', 
                component: DashboardComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] } // Solo Admin
            },
            
            // --- Módulo de Inventario ---
            { 
                path: 'prendas', 
                component: ListarPrendasComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] } // Solo Admin
            },
            { 
                path: 'nueva-prenda', 
                component: CrearPrendaComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'editar-prenda/:id', 
                component: CrearPrendaComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'categorias-tallas', 
                component: GestionCategoriasComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'temporadas', 
                component: TemporadasComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'colecciones', 
                component: ColeccionesComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            
            // --- Operaciones Operativas (Aquí entra el Encargado) ---
            { 
                path: 'entrada-inventario', 
                component: EntradaInventarioComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO] } // Admin Y Encargado de sucursal
            },

            { 
                path: 'reservas', 
                component: ReservasAdminComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO] } // Admin Y Encargado de sucursal
            },

            // --- Módulo Estructural ---
            { 
                path: 'proveedores', 
                component: GestionProveedoresComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'sucursales', 
                component: GestionSucursalesComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'gestion-usuarios', 
                component: GestionUsuariosComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            {
                path: 'mi-plan',
                component: MiPlanComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'auditoria', 
                component: BitacoraComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] } // Solo Admin
            },
            
            // Cada rol aterriza en su pantalla (el Encargado y el Cajero no ven el dashboard)
            { path: '', pathMatch: 'full', canActivate: [inicioPorRolGuard], children: [] }
        ]
    },

    // ZONA DEL ADMINISTRADOR DE PLATAFORMA (SaaS)
    {
        path: 'plataforma',
        component: PlataformaLayoutComponent,
        canActivate: [rolGuard],
        data: { roles: [ROLES.PLATAFORMA] },
        children: [
            { path: 'empresas', component: PlataformaEmpresasComponent },
            { path: 'empresas/:id', component: PlataformaEmpresaDetalleComponent },
            { path: 'planes', component: PlataformaPlanesComponent },
            { path: '', redirectTo: 'empresas', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];