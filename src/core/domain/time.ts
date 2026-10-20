import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import { z } from 'zod';
import i18n from '@/core/i18n';

export const TARGET_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const instantSchema = z.string().datetime({ offset: true });
export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
// Laravel TIME serializa HH:mm o HH:mm:ss; solo se permiten segundos cero.
export const localTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/);

export function ensureExplicitTimezoneISO(value: string): string {
  const result = instantSchema.safeParse(value);
  if (!result.success) throw new Error('TIME_ERROR: Instante sin zona horaria explícita o inválido.');
  return result.data;
}

export function argentinaLocalToInstant(date: string, time: string): string {
  localDateSchema.parse(date);
  localTimeSchema.parse(time);
  return fromZonedTime(`${date}T${time.slice(0, 5)}:00`, TARGET_TIMEZONE).toISOString();
}

export function compareInstants(isoA: string, isoB: string): number {
  const a = Date.parse(ensureExplicitTimezoneISO(isoA));
  const b = Date.parse(ensureExplicitTimezoneISO(isoB));
  return a === b ? 0 : a < b ? -1 : 1;
}

export function isInstantWithinWindow(instant: string, date: string, start: string, end: string): boolean {
  const from = argentinaLocalToInstant(date, start);
  const to = argentinaLocalToInstant(date, end);
  // Sin un día de fin en el contrato, no se adivinan ventanas que crucen medianoche.
  if (compareInstants(from, to) > 0) return false;
  return compareInstants(instant, from) >= 0 && compareInstants(instant, to) <= 0;
}

export function formatToArgentinaTime(isoString: string, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  return formatInTimeZone(parseISO(ensureExplicitTimezoneISO(isoString)), TARGET_TIMEZONE, formatStr);
}

export function formatTimeAgo(isoString: string): string {
  const diffMinutes = Math.floor((Date.now() - Date.parse(ensureExplicitTimezoneISO(isoString))) / 60000);
  if (diffMinutes < 1) return i18n.t('time.justNow');
  if (diffMinutes < 60) return i18n.t('time.minutes', { count: diffMinutes });
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return i18n.t('time.hours', { count: hours });
  return i18n.t('time.days', { count: Math.floor(hours / 24) });
}
