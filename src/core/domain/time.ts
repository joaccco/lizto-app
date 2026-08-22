import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

export const TARGET_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Invariante ADR-010: Todo instante es absoluto y lleva offset/zona horaria explícita.
 * Prohibido comparar u ordenar cadenas de hora local.
 */

export function ensureExplicitTimezoneISO(isoString: string): string {
  if (!isoString) return new Date().toISOString();
  
  // Si no especifica offset Z ni +/-HH:MM, se considera inválido según ADR-010
  const hasOffset = /Z|[+-]\d{2}:\d{2}$/.test(isoString);
  if (!hasOffset) {
    throw new Error(`TIME_ERROR: Instante sin zona horaria ni offset explícito: "${isoString}"`);
  }
  return isoString;
}

/**
 * Compara dos instantes absolutos retornando -1, 0, 1.
 * Garantiza comparación por milisegundos Unix epoch, no por cadenas locales.
 */
export function compareInstants(isoA: string, isoB: string): number {
  ensureExplicitTimezoneISO(isoA);
  ensureExplicitTimezoneISO(isoB);
  
  const timeA = Date.parse(isoA);
  const timeB = Date.parse(isoB);

  if (isNaN(timeA) || isNaN(timeB)) {
    throw new Error('TIME_ERROR: Instante inválido para comparación');
  }

  if (timeA < timeB) return -1;
  if (timeA > timeB) return 1;
  return 0;
}

/**
 * Formatea un instante ISO a la zona horaria de Buenos Aires para presentación visual.
 */
export function formatToArgentinaTime(isoString: string, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  ensureExplicitTimezoneISO(isoString);
  const date = parseISO(isoString);
  return formatInTimeZone(date, TARGET_TIMEZONE, formatStr);
}

/**
 * Retorna tiempo relativo transcurrido (ej. "Hace 15 min") para presentación.
 */
export function formatTimeAgo(isoString: string): string {
  ensureExplicitTimezoneISO(isoString);
  const now = Date.now();
  const past = Date.parse(isoString);
  const diffMinutes = Math.floor((now - past) / (1000 * 60));

  if (diffMinutes < 1) return 'Recién publicado';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}
