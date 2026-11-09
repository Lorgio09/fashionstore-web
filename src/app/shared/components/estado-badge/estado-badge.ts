import { Component, computed, input } from '@angular/core';
import { IconoComponent, NombreIcono } from '../../../shared/components/icono/icono';

/** Insignia de estado con ícono + texto (no depende solo del color). */
@Component({
  selector: 'app-estado-badge',
  standalone: true,
  imports: [IconoComponent],
  template: `
    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" [class]="estilo().clase">
      <app-icono [nombre]="estilo().icono" clase="h-3.5 w-3.5" />{{ texto() }}
    </span>
  `,
})
export class EstadoBadgeComponent {
  estado = input.required<string>();

  texto = computed(() => {
    const e = this.estado();
    const t: Record<string, string> = {
      ACTIVA: 'Activa', ACTIVO: 'Activo', INACTIVA: 'Inactiva', VENCIDA: 'Vencida', SUSPENDIDA: 'Suspendida',
      PROGRAMADA: 'Programada', SIN_SUSCRIPCION: 'Sin suscripción', REEMPLAZADA: 'Reemplazada', CANCELADA: 'Cancelada',
      // Sincronización offline (§6)
      LOCAL: 'Pendiente', ENVIADA: 'Enviando', CONFIRMADA: 'Confirmada', RECHAZADA: 'Rechazada', CONFLICTO: 'Conflicto',
      // Devoluciones y notas de crédito (§9)
      EN_INSPECCION: 'En inspección', INSPECCIONADA: 'Inspeccionada', PENDIENTE_STOCK: 'Pendiente de stock',
      CAMBIO_REALIZADO: 'Cambio realizado', REEMBOLSADA: 'Reembolsada', CERRADA_CON_NOTA: 'Cerrada con nota',
      VIGENTE: 'Vigente', USADA: 'Usada',
      // Caja (§9.5)
      ABIERTA: 'Abierta', CERRADA: 'Cerrada', PENDIENTE_AUTORIZACION: 'Pendiente de autorización',
    };
    return t[e] ?? e.charAt(0) + e.slice(1).toLowerCase().replace(/_/g, ' ');
  });

  estilo = computed((): { icono: NombreIcono; clase: string } => {
    switch (this.estado()) {
      case 'ACTIVA':
      case 'ACTIVO':
      case 'CONFIRMADA':
      case 'VIGENTE':
      case 'CAMBIO_REALIZADO':
      case 'REEMBOLSADA':
      case 'CERRADA_CON_NOTA':
        return { icono: 'ok', clase: 'bg-green-100 text-green-800' };
      case 'EN_INSPECCION':
        return { icono: 'buscar', clase: 'bg-blue-100 text-blue-800' };
      case 'INSPECCIONADA':
        return { icono: 'reloj', clase: 'bg-indigo-100 text-indigo-800' };
      case 'ABIERTA':
        return { icono: 'punto', clase: 'bg-green-100 text-green-800' };
      case 'CERRADA':
        return { icono: 'candado', clase: 'bg-gray-200 text-gray-800' };
      case 'PENDIENTE_AUTORIZACION':
      case 'PENDIENTE_STOCK':
        return { icono: 'alerta', clase: 'bg-amber-100 text-amber-900' };
      case 'USADA':
        return { icono: 'neutro', clase: 'bg-gray-200 text-gray-700' };
      case 'SUSPENDIDA':
      case 'VENCIDA':
      case 'RECHAZADA':
        return { icono: 'cerrar', clase: 'bg-red-100 text-red-800' };
      case 'CONFLICTO':
        return { icono: 'alerta', clase: 'bg-amber-100 text-amber-900' };
      case 'LOCAL':
        return { icono: 'reloj', clase: 'bg-gray-200 text-gray-800' };
      case 'ENVIADA':
        return { icono: 'enviar', clase: 'bg-blue-100 text-blue-800' };
      case 'PROGRAMADA':
        return { icono: 'reloj', clase: 'bg-blue-100 text-blue-800' };
      default:
        return { icono: 'punto', clase: 'bg-gray-100 text-gray-700' };
    }
  });
}
