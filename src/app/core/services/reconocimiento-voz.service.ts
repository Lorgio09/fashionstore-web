import { Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface EventosVoz {
  /** Texto parcial mientras se habla. */
  parcial?: (texto: string) => void;
  /** Texto final reconocido. */
  final: (texto: string) => void;
  error?: (mensaje: string) => void;
}

/**
 * Dictado con la Web Speech API (`webkitSpeechRecognition`, es-BO).
 * Solo existe en el navegador (Chrome/Edge); en el servidor (SSR) `soportado` es false.
 */
@Injectable({ providedIn: 'root' })
export class ReconocimientoVozService {
  private zone = inject(NgZone);
  private readonly ctor: any = isPlatformBrowser(inject(PLATFORM_ID))
    ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
    : null;
  private reconocedor: any = null;

  readonly soportado = !!this.ctor;
  readonly escuchando = signal(false);

  escuchar(eventos: EventosVoz): void {
    if (!this.ctor) return;
    this.detener();
    const r = new this.ctor();
    r.lang = 'es-BO';
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;

    r.onstart = () => this.zone.run(() => this.escuchando.set(true));
    r.onresult = (ev: any) => this.zone.run(() => {
      let texto = '';
      let esFinal = false;
      for (let i = 0; i < ev.results.length; i++) {
        texto += ev.results[i][0].transcript;
        esFinal ||= ev.results[i].isFinal;
      }
      texto = texto.trim();
      if (esFinal) eventos.final(texto);
      else eventos.parcial?.(texto);
    });
    r.onerror = (ev: any) => this.zone.run(() => {
      this.escuchando.set(false);
      if (ev?.error === 'aborted' || ev?.error === 'no-speech') {
        if (ev.error === 'no-speech') eventos.error?.('No se escuchó nada. Intenta de nuevo.');
        return;
      }
      eventos.error?.(ev?.error === 'not-allowed'
        ? 'Permite el uso del micrófono en el navegador.'
        : 'No se pudo usar el micrófono.');
    });
    r.onend = () => this.zone.run(() => this.escuchando.set(false));

    this.reconocedor = r;
    try { r.start(); } catch { this.escuchando.set(false); }
  }

  detener(): void {
    try { this.reconocedor?.abort(); } catch { /* ya detenido */ }
    this.reconocedor = null;
    this.escuchando.set(false);
  }
}
