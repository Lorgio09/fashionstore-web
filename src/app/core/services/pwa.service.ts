import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { OfflineRepository } from '../persistence/offline.repository';

/**
 * Arranque de la PWA en el navegador: abre IndexedDB, recupera operaciones que quedaron ENVIADA
 * y avisa cuando el service worker descargó una versión nueva.
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private repo = inject(OfflineRepository);
  private sw = inject(SwUpdate);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** true cuando hay una versión nueva lista; la app muestra un aviso para recargar. */
  readonly actualizacionLista = signal(false);
  readonly indexedDbLista = signal(false);

  async iniciar(): Promise<void> {
    if (!this.esNavegador) return;

    if (this.sw.isEnabled) {
      this.sw.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
        .subscribe(() => this.actualizacionLista.set(true));
    }

    try {
      await this.repo.inicializar();
      await this.repo.reiniciarEnviadas(); // §6 regla 2: ENVIADA al reabrir → LOCAL
      this.indexedDbLista.set(true);
    } catch (e) {
      console.error('No se pudo abrir IndexedDB', e);
    }
  }

  async aplicarActualizacion(): Promise<void> {
    if (this.sw.isEnabled) await this.sw.activateUpdate();
    document.location.reload();
  }
}
