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
