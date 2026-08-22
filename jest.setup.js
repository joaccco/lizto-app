const React = require('react');
const { NativeModules } = require('react-native');

global.React = React;

if (!NativeModules.UIManager) {
  NativeModules.UIManager = {};
}

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
