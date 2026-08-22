import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from '@/components/ui/Text';

describe('Criterio de Aceptación 1: Carga y aplicación de tipografía Manrope e IBM Plex Mono', () => {
  test('Aplica la fuente Manrope_800ExtraBold para encabezados h1', async () => {
    const { getByText } = await render(<Text variant="h1">Lizto App</Text>);
    const textElement = getByText('Lizto App');
    
    expect(textElement).toBeTruthy();
    // Verificar que la clase font-sans-extrabold traduce o aplica la familia Manrope_800ExtraBold
    expect(textElement.props.className).toContain('font-sans-extrabold');
  });

  test('Aplica la fuente IBMPlexMono_400Regular para variante mono', async () => {
    const { getByText } = await render(<Text variant="mono">MONO_123</Text>);
    const textElement = getByText('MONO_123');

    expect(textElement).toBeTruthy();
    expect(textElement.props.className).toContain('font-mono');
  });
});
