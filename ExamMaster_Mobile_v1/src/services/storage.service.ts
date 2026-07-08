import { getItemAsync, setItemAsync, deleteItemAsync } from './secureStore';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  STUDENT_USER: 'studentUser',
  REMEMBER_DEVICE: 'rememberDevice',
} as const;

export const storage = {
  async getToken(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setToken(token: string): Promise<void> {
    await setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async getUser(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.STUDENT_USER);
  },

  async setUser(user: object): Promise<void> {
    await setItemAsync(STORAGE_KEYS.STUDENT_USER, JSON.stringify(user));
  },

  async getRememberDevice(): Promise<string | null> {
    return getItemAsync(STORAGE_KEYS.REMEMBER_DEVICE);
  },

  async setRememberDevice(value: boolean): Promise<void> {
    await setItemAsync(STORAGE_KEYS.REMEMBER_DEVICE, value ? 'true' : 'false');
  },

  async clearAll(): Promise<void> {
    await deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await deleteItemAsync(STORAGE_KEYS.STUDENT_USER);
    await deleteItemAsync(STORAGE_KEYS.REMEMBER_DEVICE);
  },

  async hasSession(): Promise<boolean> {
    const token = await getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  },
};
