import { createMoney, parseDecimalToMoney, formatMoney } from '../src/core/domain/money';

describe('Criterios de Aceptación: Invariante de Dinero (ADR-010)', () => {
  test('7. Un importe se renderiza correctamente formateado partiendo de un entero en unidad mínima más código de moneda', () => {
    // 1500000 centavos ARS = $ 15.000,00 ARS
    const money = createMoney(1500000, 'ARS');
    const formatted = formatMoney(money);

    expect(money.amountInCents).toBe(1500000);
    expect(money.currency).toBe('ARS');
    expect(formatted).toContain('15.000,00');
    expect(formatted).toContain('ARS');
  });

  test('Convierte montos decimales de la API a unidades mínimas en el borde', () => {
    // La API devuelve 25000.50 como decimal
    const money = parseDecimalToMoney(25000.50, 'ARS');

    expect(money.amountInCents).toBe(2500050);
    expect(formatMoney(money)).toContain('25.000,50');
  });

  test('Rechaza creación de Money con números decimales sin convertir', () => {
    expect(() => createMoney(1500.75, 'ARS')).toThrow('MONEY_ERROR');
  });
});
