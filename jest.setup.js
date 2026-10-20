const React = require('react');
const { NativeModules } = require('react-native');

global.React = React;
global.__mockFontsState = [true, null];

if (!NativeModules.UIManager) {
  NativeModules.UIManager = {};
}

jest.mock('expo-font', () => {
  return {
    useFonts: jest.fn(() => global.__mockFontsState || [true, null]),
    loadAsync: jest.fn().mockResolvedValue(true),
    isLoaded: jest.fn(() => true),
  };
});

jest.mock('expo-secure-store', () => {
  let store = {};
  return {
    setItemAsync: jest.fn(async (key, val) => {
      store[key] = val;
    }),
    getItemAsync: jest.fn(async (key) => store[key] || null),
    deleteItemAsync: jest.fn(async (key) => {
      delete store[key];
    }),
  };
});

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:8000/api/v1',
    },
  },
}));

// Las cachés de prueba se liberan al desmontar; no esperamos el GC de cinco minutos de producción.
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    QueryClient: class extends actual.QueryClient {
      constructor(options = {}) {
        super({ ...options, defaultOptions: {
          ...options.defaultOptions,
          queries: { gcTime: 0, ...options.defaultOptions?.queries },
          mutations: { gcTime: 0, ...options.defaultOptions?.mutations },
        } });
      }
    },
  };
});
