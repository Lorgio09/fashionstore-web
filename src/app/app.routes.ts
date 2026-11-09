import { Routes } from '@angular/router';
import { ROLES } from './core/models/sesion';

import { InicioComponent } from './features/inicio/inicio';
import { LoginComponent } from './features/auth/login/login'; 
import { rolGuard, inicioPorRolGuard } from './core/guards/admin-guard';
import { portadaGuard, redirigirATienda, tiendaGuard } from './core/guards/tienda.guard';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout'; 
import { DetallePrendaComponent } from './features/detalle-prenda/detalle-prenda';
import { CarritoComponent } from './features/carrito/carrito';
import { CheckoutComponent } from './features/checkout/checkout';
import { PuntoVentaComponent } from './features/admin/punto-venta/punto-venta';
import { SincronizacionComponent } from './features/offline/sincronizacion/sincronizacion';
import { ConflictosComponent } from './features/offline/conflictos/conflictos';

export const routes: Routes = [
    // Portada de la plataforma FashionStore: planes y directorio de tiendas (§2.1)
    { path: '', pathMatch: 'full', canActivate: [portadaGuard], loadComponent: () => import('./features/portada/portada').then(m => m.PortadaComponent) },
    // Cada empresa es una tienda con su nombre: el catálogo y la compra viven dentro de /tienda/:slug
    {
        path: 'tienda/:slug',
        canActivate: [tiendaGuard],
        children: [
            { path: '', component: InicioComponent },
            { path: 'prenda/:id', component: DetallePrendaComponent },
            { path: 'carrito', component: CarritoComponent },
            { path: 'checkout', component: CheckoutComponent },
        ]
    },
    { path: 'login', component: LoginComponent },
    { path: 'registro', loadComponent: () => import('./features/auth/registro/registro').then(m => m.RegistroComponent) },
    { path: 'recuperar-password', loadComponent: () => import('./features/auth/recuperar-password/recuperar-password').then(m => m.RecuperarPasswordComponent) },
    // Rutas antiguas de la tienda: llevan a la última tienda visitada
    { path: 'prenda/:id', canActivate: [redirigirATienda('prenda/:id')], children: [] },
    { path: 'carrito', canActivate: [redirigirATienda('carrito')], children: [] },
    { path: 'checkout', canActivate: [redirigirATienda('checkout')], children: [] },
    // Modo offline y pendientes del cliente (el personal lo tiene dentro de /admin)
    { path: 'sincronizacion', component: SincronizacionComponent, canActivate: [rolGuard], data: { roles: [ROLES.CLIENTE] } },

    // Área del cliente: compras, devoluciones y notas de crédito (§9)
    {
        path: 'mi-cuenta',
        loadComponent: () => import('./features/mi-cuenta/mi-cuenta-layout').then(m => m.MiCuentaLayoutComponent),
        canActivate: [rolGuard],
        data: { roles: [ROLES.CLIENTE] },
        children: [
            { path: '', loadComponent: () => import('./features/mi-cuenta/mi-cuenta').then(m => m.MiCuentaComponent) },
            { path: 'solicitudes/:codigo', loadComponent: () => import('./features/devoluciones/detalle-solicitud/detalle-solicitud').then(m => m.DetalleSolicitudComponent) },
        ]
    },

    // ZONA DEL ADMINISTRADOR Y EMPLEADOS
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [rolGuard],
        // Personal de la empresa: Administrador, Encargado de sucursal y Cajero
        data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] },
        children: [
            {
                path: 'sincronizacion',
                component: SincronizacionComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] }
            },
            {
                path: 'conflictos',
                component: ConflictosComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO] }
            },
            { 
                path: 'punto-venta', 
                component: PuntoVentaComponent,
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] } // Caja: Cajero, Encargado y Admin
            },
            {
                path: 'caja',
                loadComponent: () => import('./features/caja/turnos-caja/turnos-caja').then(m => m.TurnosCajaComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] }
            },
            // --- Posventa: devoluciones, cambios y notas de crédito (§9) ---
            {
                path: 'devoluciones',
                loadComponent: () => import('./features/devoluciones/historial-devoluciones/historial-devoluciones').then(m => m.HistorialDevolucionesComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] }
            },
            {
                path: 'devoluciones/nueva',
                loadComponent: () => import('./features/devoluciones/nueva-solicitud/nueva-solicitud').then(m => m.NuevaSolicitudComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] }
            },
            {
                path: 'devoluciones/:codigo',
                loadComponent: () => import('./features/devoluciones/detalle-solicitud/detalle-solicitud').then(m => m.DetalleSolicitudComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] }
            },
            {
                path: 'notas-credito',
                loadComponent: () => import('./features/devoluciones/notas-credito/notas-credito').then(m => m.NotasCreditoComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO, ROLES.CAJERO] }
            },
            {
                path: 'politica-devoluciones',
                loadComponent: () => import('./features/devoluciones/politica-devoluciones/politica-devoluciones').then(m => m.PoliticaDevolucionesComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            {
                path: 'analitica',
                loadComponent: () => import('./features/analitica/analitica').then(m => m.AnaliticaComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO], funcion: 'reportes_ia' } // Plan Profesional
            },
            {
                path: 'reportes-ia',
                loadComponent: () => import('./features/reportes-ia/reportes-ia').then(m => m.ReportesIaComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO], funcion: 'reportes_ia' } // Plan Profesional
            },
            { 
                path: 'dashboard', 
                loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] } // Solo Admin
            },
            
            // --- Módulo de Inventario ---
            { 
                path: 'prendas', 
                loadComponent: () => import('./features/admin/listar-prenda/listar-prenda').then(m => m.ListarPrendasComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] } // Solo Admin
            },
            { 
                path: 'nueva-prenda', 
                loadComponent: () => import('./features/admin/crear-prenda/crear-prenda').then(m => m.CrearPrendaComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'editar-prenda/:id', 
                loadComponent: () => import('./features/admin/crear-prenda/crear-prenda').then(m => m.CrearPrendaComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'categorias-tallas', 
                loadComponent: () => import('./features/gestion-categorias/gestion-categorias').then(m => m.GestionCategoriasComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'temporadas', 
                loadComponent: () => import('./features/temporadas/temporadas').then(m => m.TemporadasComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'colecciones', 
                loadComponent: () => import('./features/colecciones/colecciones').then(m => m.ColeccionesComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            
            // --- Operaciones Operativas (Aquí entra el Encargado) ---
            { 
                path: 'entrada-inventario', 
                loadComponent: () => import('./features/entrada-inventario/entrada-inventario').then(m => m.EntradaInventarioComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO] } // Admin Y Encargado de sucursal
            },

            { 
                path: 'reservas', 
                loadComponent: () => import('./features/reservas/reservas').then(m => m.ReservasAdminComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN, ROLES.ENCARGADO] } // Admin Y Encargado de sucursal
            },

            // --- Módulo Estructural ---
            { 
                path: 'proveedores', 
                loadComponent: () => import('./features/gestion-proveedores/gestion-proveedores').then(m => m.GestionProveedoresComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'sucursales', 
                loadComponent: () => import('./features/gestion-sucursales/gestion-sucursales').then(m => m.GestionSucursalesComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'gestion-usuarios', 
                loadComponent: () => import('./features/gestion-usuarios/gestion-usuarios').then(m => m.GestionUsuariosComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            {
                path: 'mi-plan',
                loadComponent: () => import('./features/mi-plan/mi-plan').then(m => m.MiPlanComponent),
                canActivate: [rolGuard],
                data: { roles: [ROLES.ADMIN] }
            },
            { 
                path: 'auditoria', 
                loadComponent: () => import('./features/bitacora/bitacora').then(m => m.BitacoraComponent),
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
        loadComponent: () => import('./features/plataforma/plataforma-layout/plataforma-layout').then(m => m.PlataformaLayoutComponent),
        canActivate: [rolGuard],
        data: { roles: [ROLES.PLATAFORMA] },
        children: [
            { path: 'empresas', loadComponent: () => import('./features/plataforma/empresas/empresas').then(m => m.PlataformaEmpresasComponent) },
            { path: 'empresas/:id', loadComponent: () => import('./features/plataforma/empresa-detalle/empresa-detalle').then(m => m.PlataformaEmpresaDetalleComponent) },
            { path: 'planes', loadComponent: () => import('./features/plataforma/planes/planes').then(m => m.PlataformaPlanesComponent) },
            { path: '', redirectTo: 'empresas', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];