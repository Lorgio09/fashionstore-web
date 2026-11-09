import { Component, computed, input } from '@angular/core';

/** Insignia de estado con ícono + texto (no depende solo del color). */
@Component({
  selector: 'app-estado-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" [class]="estilo().clase">
      <span aria-hidden="true">{{ estilo().icono }}</span>{{ texto() }}
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

  estilo = computed(() => {
    switch (this.estado()) {
      case 'ACTIVA':
      case 'ACTIVO':
      case 'CONFIRMADA':
      case 'VIGENTE':
      case 'CAMBIO_REALIZADO':
      case 'REEMBOLSADA':
      case 'CERRADA_CON_NOTA':
        return { icono: '✓', clase: 'bg-green-100 text-green-800' };
      case 'EN_INSPECCION':
        return { icono: '🔍', clase: 'bg-blue-100 text-blue-800' };
      case 'INSPECCIONADA':
        return { icono: '◷', clase: 'bg-indigo-100 text-indigo-800' };
      case 'ABIERTA':
        return { icono: '●', clase: 'bg-green-100 text-green-800' };
      case 'CERRADA':
        return { icono: '■', clase: 'bg-gray-200 text-gray-800' };
      case 'PENDIENTE_AUTORIZACION':
      case 'PENDIENTE_STOCK':
        return { icono: '⚠', clase: 'bg-amber-100 text-amber-900' };
      case 'USADA':
        return { icono: '■', clase: 'bg-gray-200 text-gray-700' };
      case 'SUSPENDIDA':
      case 'VENCIDA':
      case 'RECHAZADA':
        return { icono: '✕', clase: 'bg-red-100 text-red-800' };
      case 'CONFLICTO':
        return { icono: '⚠', clase: 'bg-amber-100 text-amber-900' };
      case 'LOCAL':
        return { icono: '◷', clase: 'bg-gray-200 text-gray-800' };
      case 'ENVIADA':
        return { icono: '↑', clase: 'bg-blue-100 text-blue-800' };
      case 'PROGRAMADA':
        return { icono: '◷', clase: 'bg-blue-100 text-blue-800' };
      default:
        return { icono: '•', clase: 'bg-gray-100 text-gray-700' };
    }
  });
}
