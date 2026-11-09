const p = (n: number) => String(n).padStart(2, '0');

/** Fecha y hora local con zona, p. ej. '2026-11-03T14:05:00-04:00' (creado_en de las operaciones offline). */
export function ahoraIsoLocal(d: Date = new Date()): string {
  const off = -d.getTimezoneOffset();
  const signo = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` +
    `${signo}${p(Math.floor(abs / 60))}:${p(abs % 60)}`
  );
}

/**
 * Valor de un <input type="datetime-local"> ('YYYY-MM-DDTHH:mm') → hora local sin zona 'YYYY-MM-DDTHH:mm:ss'.
 * Así espera `fecha_visita` el backend (POST /reservas y operaciones RESERVA). No usar toISOString(): pasa a UTC.
 */
export function fechaHoraLocalSinZona(valor: string): string {
  return valor.length === 16 ? `${valor}:00` : valor;
}

/** 'hace 5 min', 'hace 3 h', 'hace 2 días'. */
export function haceCuanto(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms)) return '—';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

/** Fecha y hora legible en es-BO: '07/11/2026 19:20'. */
export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
