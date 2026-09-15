import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Mock app/_layout useAppFonts
jest.mock('../app/_layout', () => {
  const actual = jest.requireActual('../app/_layout');
  return {
    __esModule: true,
    ...actual,
    useAppFonts: () => global.__mockFontsState || [true, null],
  };
});

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSegments: () => ['(auth)'],
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => {
      const { View } = require('react-native');
      return <View testID="root-stack">{children}</View>;
    },
    { Screen: () => null }
  ),
}));

import RootLayout from '../app/_layout';

declare global {
  var __mockFontsState: [boolean, Error | null];
}

describe('Carga de fuentes en Layout Raíz (RootLayout)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ isInitialized: true, token: null, activeRole: null });
  });

  test('NO renderiza los hijos mientras las fuentes están pendientes ([false, null])', async () => {
    global.__mockFontsState = [false, null];

    const { queryByTestId } = await render(<RootLayout />);
    // El árbol debe ser nulo mientras las fuentes no estén listas y no haya error
    expect(queryByTestId('root-stack')).toBeNull();
  });

  test('SÍ renderiza los hijos cuando las fuentes han cargado ([true, null])', async () => {
    global.__mockFontsState = [true, null];

    const { getByTestId } = render(<RootLayout />);
    // Al cargar las fuentes, el layout libera el árbol de componentes
    await waitFor(() => expect(getByTestId('root-stack')).toBeTruthy());
  });

  test('SÍ renderiza los hijos si ocurrió un error al cargar fuentes ([false, Error])', async () => {
    global.__mockFontsState = [false, new Error('Error al cargar fuente')];

    const { getByTestId } = render(<RootLayout />);
    // Ante un error de carga de fuente, no se bloquea indefinidamente la app
    await waitFor(() => expect(getByTestId('root-stack')).toBeTruthy());
  });
});
