import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfflineRepository } from '../persistence/offline.repository';
import { OperacionLocal, ResultadoSync } from '../models/offline';
import { AuthService } from '../services/auth';
import { ConexionService } from '../services/conexion.service';
import { NotificacionService } from '../services/notificacion.service';
import { OperacionesOfflineService } from '../services/operaciones-offline.service';

const LOTE = 50;               // §6.2: máximo 50 operaciones por lote
const LOTE_ESTADO = 200;       // §6.3: máximo 200 uuids
const CADA_MS = 60_000;        // §6 regla 3: cada 60 s con red

export interface ResumenSync {
  enviadas: number;
  confirmadas: number;
  conflictos: number;
  rechazadas: number;
  reintentar: number;
  error: string | null;
}

/**
 * Capa de sincronización (RNF07). Envía las operaciones LOCAL del usuario a POST /sync/operaciones,
 * aplica los resultados y refresca los CONFLICTO con POST /sync/estado.
 * Se dispara manualmente, al volver la red y cada 60 s (§6 regla 3).
 */
@Injectable({ providedIn: 'root' })
export class SincronizacionService {
  private http = inject(HttpClient);
  private repo = inject(OfflineRepository);
  private auth = inject(AuthService);
  private conexion = inject(ConexionService);
  private notif = inject(NotificacionService);
  private ops = inject(OperacionesOfflineService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly sincronizando = signal(false);
  readonly ultimaSync = signal<string | null>(null);
  readonly ultimoResumen = signal<ResumenSync | null>(null);
  private iniciado = false;

  constructor() {
    // Al volver la conexión → sincronizar (§6 regla 3).
    let anterior = this.conexion.enLinea();
    effect(() => {
      const ahora = this.conexion.enLinea();
      if (ahora && !anterior) setTimeout(() => this.sincronizar());
      anterior = ahora;
    });
    // Al cambiar de sesión → recargar la lista del usuario.
    effect(() => {
      this.auth.usuario();
      setTimeout(() => this.ops.refrescar());
    });
  }

  /** Arranque en el navegador: primera sincronización y temporizador de 60 s. */
  iniciar(): void {
    if (!this.esNavegador || this.iniciado) return;
    this.iniciado = true;
    setTimeout(() => this.sincronizar(), 3000);
    setInterval(() => {
      if (this.conexion.enLinea() && this.auth.autenticado() && (this.ops.pendientes() > 0 || this.ops.conflictos() > 0)) {
        this.sincronizar();
      }
    }, CADA_MS);
  }

  /** Envía lo pendiente del usuario logueado. `manual` muestra el resultado al usuario. */
  async sincronizar(manual = false): Promise<ResumenSync | null> {
    if (!this.esNavegador || this.sincronizando() || !this.repo.disponible) return null;
    const u = this.auth.usuario();
    const e = this.auth.empresa();
    if (!u || !e) return null;
    if (!this.conexion.enLinea()) {
      if (manual) this.notif.aviso('Sin conexión. Las operaciones quedan guardadas y se enviarán al volver la red.');
      return null;
    }

    this.sincronizando.set(true);
    const r: ResumenSync = { enviadas: 0, confirmadas: 0, conflictos: 0, rechazadas: 0, reintentar: 0, error: null };
    try {
      const pendientes = await this.repo.pendientesDe(e.id, u.id); // solo las del usuario (§6 regla 4)
      const dispositivo_id = await this.repo.dispositivoId();

      for (let i = 0; i < pendientes.length; i += LOTE) {
        const lote = pendientes.slice(i, i + LOTE);
        const ok = await this.enviarLote(lote, dispositivo_id, r);
        if (!ok) break; // red caída, 401/403 o 422: no seguir con más lotes
      }
      if (!r.error) await this.refrescarConflictos(e.id, u.id);
      this.ultimaSync.set(new Date().toISOString());
    } finally {
      this.sincronizando.set(false);
      await this.ops.refrescar();
    }
    this.ultimoResumen.set(r);

    if (manual) {
      if (r.error) this.notif.error(r.error, 'No se pudo sincronizar');
      else if (r.enviadas === 0) this.notif.exito('No hay operaciones pendientes.', 'Sincronizado');
      else this.notif.exito(this.textoResumen(r), 'Sincronización terminada');
    } else if (r.enviadas > 0) {
      if (r.conflictos || r.rechazadas) this.notif.aviso(this.textoResumen(r), 'Sincronización con observaciones');
      else this.notif.exito(this.textoResumen(r), 'Sincronizado');
    }
    return r;
  }

  private async enviarLote(lote: OperacionLocal[], dispositivo_id: string, r: ResumenSync): Promise<boolean> {
    const ahora = new Date().toISOString();
    for (const op of lote) await this.repo.actualizarOperacion(op.uuid, { estado: 'ENVIADA', ultimo_intento: ahora });
    await this.ops.refrescar();

    try {
      const resp = await firstValueFrom(
        this.http.post<{ procesadas: number; resultados: ResultadoSync[] }>(`${environment.apiUrl}/sync/operaciones`, {
          dispositivo_id,
          operaciones: lote.map((o) => this.payload(o)),
        }),
      );
      r.enviadas += lote.length;
      const porUuid = new Map(resp.resultados.map((x) => [x.uuid, x]));
      for (const op of lote) {
        const res = porUuid.get(op.uuid);
        if (res) await this.aplicar(op, res, r);
        else await this.volverALocal(op, 'El servidor no devolvió resultado para esta operación', true, r);
      }
      return true;
    } catch (err) {
      const http = err instanceof HttpErrorResponse ? err : null;
      const detalle = NotificacionService.detalle(err) ?? 'Error desconocido';
      if (http && (http.status === 401 || http.status === 403)) {
        // §6 regla 6: no cambiar estados (se deshace el ENVIADA) y reintentar después.
        for (const op of lote) await this.repo.actualizarOperacion(op.uuid, { estado: 'LOCAL', ultimo_error: detalle });
        r.error = detalle;
      } else {
        // Sin red, timeout, 5xx o 422: vuelve a LOCAL con intentos + 1.
        const msg = http?.status === 0 ? 'Sin conexión con el servidor' : `${http?.status ?? ''} ${detalle}`.trim();
        for (const op of lote) await this.volverALocal(op, msg, true, r);
        r.error = msg;
      }
      return false;
    }
  }

  private async aplicar(op: OperacionLocal, res: ResultadoSync, r: ResumenSync): Promise<void> {
    switch (res.estado) {
      case 'CONFIRMADA':
      case 'CONFLICTO':
      case 'RECHAZADA':
        await this.repo.actualizarOperacion(op.uuid, {
          estado: res.estado,
          servidor_id: res.servidor_id ?? null,
          mensaje_servidor: res.mensaje ?? null,
          detalle_servidor: res.detalle ?? null,
          ultimo_error: null,
        });
        if (res.estado === 'CONFIRMADA') r.confirmadas++;
        if (res.estado === 'CONFLICTO') r.conflictos++;
        if (res.estado === 'RECHAZADA') {
          r.rechazadas++;
          await this.repo.devolverStockEstimado(op);
        }
        break;
      case 'ERROR': // falla temporal solo de esta operación: no es final
        await this.volverALocal(op, res.mensaje ?? 'Error temporal del servidor', true, r);
        break;
      case 'DESCONOCIDA': // el servidor nunca la recibió: reenviar
        await this.volverALocal(op, res.mensaje ?? 'El servidor no recibió esta operación', false, r);
        break;
    }
  }

  private async volverALocal(op: OperacionLocal, error: string, contarIntento: boolean, r: ResumenSync): Promise<void> {
    const actual = await this.repo.operacion(op.uuid);
    await this.repo.actualizarOperacion(op.uuid, {
      estado: 'LOCAL',
      intentos: (actual?.intentos ?? op.intentos) + (contarIntento ? 1 : 0),
      ultimo_error: error,
    });
    r.reintentar++;
  }

  /** §6.3: los CONFLICTO pueden haberse resuelto en la web (por un Encargado/Administrador). */
  private async refrescarConflictos(empresaId: string, usuarioId: number): Promise<void> {
    const enConflicto = await this.repo.operacionesEnEstado(empresaId, usuarioId, 'CONFLICTO');
    for (let i = 0; i < enConflicto.length; i += LOTE_ESTADO) {
      const lote = enConflicto.slice(i, i + LOTE_ESTADO);
      try {
        const resp = await firstValueFrom(
          this.http.post<{ resultados: ResultadoSync[] }>(`${environment.apiUrl}/sync/estado`, { uuids: lote.map((o) => o.uuid) }),
        );
        const porUuid = new Map(resp.resultados.map((x) => [x.uuid, x]));
        for (const op of lote) {
          const res = porUuid.get(op.uuid);
          if (res && res.estado !== 'CONFLICTO') {
            await this.aplicar(op, res, { enviadas: 0, confirmadas: 0, conflictos: 0, rechazadas: 0, reintentar: 0, error: null });
          }
        }
      } catch {
        return; // se reintenta en la próxima sincronización
      }
    }
  }

  /** Cuerpo de la operación para el servidor: solo los campos del contrato. */
  private payload(o: OperacionLocal) {
    const base = {
      uuid: o.uuid, tipo: o.tipo, empresa_id: o.empresa_id, sucursal_id: o.sucursal_id,
      usuario_id: o.usuario_id, creado_en: o.creado_en,
    };
    if (o.tipo === 'VENTA') {
      const d = o.datos as import('../models/offline').DatosVenta;
      return {
        ...base,
        datos: {
          metodo_pago: d.metodo_pago, cliente_id: d.cliente_id, nombre_cliente: d.nombre_cliente, total: d.total,
          items: d.items.map((i) => ({ variante_id: i.variante_id, cantidad: i.cantidad, precio_unitario: i.precio_unitario })),
        },
      };
    }
    const d = o.datos as import('../models/offline').DatosReserva;
    return {
      ...base,
      datos: { cliente_id: d.cliente_id, fecha_visita: d.fecha_visita, items: d.items.map((i) => ({ variante_id: i.variante_id, cantidad: i.cantidad })) },
    };
  }

  private textoResumen(r: ResumenSync): string {
    const partes = [`${r.confirmadas} confirmada(s)`];
    if (r.conflictos) partes.push(`${r.conflictos} en conflicto`);
    if (r.rechazadas) partes.push(`${r.rechazadas} rechazada(s)`);
    if (r.reintentar) partes.push(`${r.reintentar} por reintentar`);
    return partes.join(' · ');
  }
}
