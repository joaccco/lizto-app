/**
 * Invariante ADR-010: El dinero es un entero en la unidad mínima de la moneda
 * acompañado del código ISO de la moneda (ej. ARS).
 */

export interface Money {
  amountInCents: number;
  currency: string;
}

export function createMoney(amountInCents: number, currency: string = 'ARS'): Money {
  if (!Number.isInteger(amountInCents)) {
    throw new Error(`MONEY_ERROR: amountInCents debe ser un número entero. Valor recibido: ${amountInCents}`);
  }
  return {
    amountInCents,
    currency,
  };
}

/**
 * Convierte un monto decimal recibido del backend (ej. 15000.00) a unidad mínima entera (centavos).
 */
export function parseDecimalToMoney(decimalAmount: number | string, currency: string = 'ARS'): Money {
  const num = typeof decimalAmount === 'string' ? parseFloat(decimalAmount) : decimalAmount;
  if (isNaN(num)) {
    return createMoney(0, currency);
  }
  const cents = Math.round(num * 100);
  return createMoney(cents, currency);
}

/**
 * Formatea el dinero a texto exclusivamente en la capa de presentación.
 */
export function formatMoney(money: Money): string {
  const mainUnits = money.amountInCents / 100;
  const formattedNumber = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(mainUnits);

  return `$ ${formattedNumber} ${money.currency}`;
}
