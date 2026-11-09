import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Estado de la red del navegador (`navigator.onLine` + eventos online/offline). En SSR se asume en línea. */
@Injectable({ providedIn: 'root' })
export class ConexionService {
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _enLinea = signal(true);
  readonly enLinea = this._enLinea.asReadonly();

  constructor() {
    if (!this.esNavegador) return;
    this._enLinea.set(navigator.onLine);
    window.addEventListener('online', () => this._enLinea.set(true));
    window.addEventListener('offline', () => this._enLinea.set(false));
  }
}
