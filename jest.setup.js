jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, val: string) => {
      store[key] = val;
    }),
    getItemAsync: jest.fn(async (key: string) => store[key] || null),
    deleteItemAsync: jest.fn(async (key: string) => {
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
