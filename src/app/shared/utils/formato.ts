// Formatos para Bolivia (es-BO).

/**
 * 'YYYY-MM-DD' (o ISO) → 'dd/mm/aaaa'. Las fechas sin hora se formatean sin pasar por Date,
 * porque `new Date('2026-11-04')` es medianoche UTC y en Bolivia (UTC-4) mostraría el día anterior.
 */
export function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(valor);
  if (isNaN(d.getTime())) return valor;
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** 1234.5 → '1.234,50' */
export function numero(valor: number | null | undefined, decimales = 2): string {
  if (valor === null || valor === undefined || isNaN(Number(valor))) return '—';
  return Number(valor).toLocaleString('es-BO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    useGrouping: true,
  });
}

/** Fecha de hoy en hora local, 'YYYY-MM-DD'. */
export function hoyIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
