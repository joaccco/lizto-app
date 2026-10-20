import { z } from 'zod';

export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const minorAmountSchema = z.number().int().nonnegative().safe();
export const moneySchema = z.object({ amountInCents: minorAmountSchema, currency: currencySchema });
export type Money = z.infer<typeof moneySchema>;

export function createMoney(amountInCents: number, currency: string = 'ARS'): Money {
  const result = moneySchema.safeParse({ amountInCents, currency });
  if (!result.success) throw new Error('MONEY_ERROR: Importe o moneda inválidos.');
  return result.data;
}

// Conversión decimal exclusivamente para el contrato heredado del backend.
export function parseDecimalToMoney(decimalAmount: number | string, currency: string = 'ARS'): Money {
  const text = String(decimalAmount);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('MONEY_ERROR: Decimal inválido.');
  const [whole, fraction = ''] = text.split('.');
  return createMoney(Number(whole) * 100 + Number(fraction.padEnd(2, '0')), currency);
}

// El ingreso es texto de presentación es-AR; el resultado siempre es entero.
export function parseMoneyInput(text: string): number {
  const value = text.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) {
    throw new Error('MONEY_ERROR: Importe inválido.');
  }
  return parseDecimalToMoney(value.replace(/\./g, '').replace(',', '.')).amountInCents;
}

// Serializa para Laravel sin pasar por un número decimal de punto flotante.
export function toBackendDecimal(amountInCents: number): string {
  minorAmountSchema.parse(amountInCents);
  return `${Math.floor(amountInCents / 100)}.${String(amountInCents % 100).padStart(2, '0')}`;
}

export function formatMoney(money: Money): string {
  const validated = moneySchema.parse(money);
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: validated.currency, currencyDisplay: 'code' }).format(validated.amountInCents / 100);
}
