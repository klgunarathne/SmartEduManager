import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getItemAsync, setItemAsync, deleteItemAsync } from './secureStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://localhost:7160/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await getItemAsync('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = await getItemAsync('refreshToken');
            if (!refreshToken) {
              await this.clearSession();
              throw error;
            }

            const refreshResponse = await axios.post(`${API_BASE_URL}/Auth/refresh-token`, {
              accessToken: await getItemAsync('accessToken'),
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
            await setItemAsync('accessToken', accessToken);
            await setItemAsync('refreshToken', newRefreshToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch {
            await this.clearSession();
            throw error;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async clearSession(): Promise<void> {
    await deleteItemAsync('accessToken');
    await deleteItemAsync('refreshToken');
    await deleteItemAsync('studentUser');
    await deleteItemAsync('rememberDevice');
  }

  get<T = any>(url: string, config?: any): Promise<T> {
    return this.client.get(url, config).then((res) => res.data);
  }

  post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post(url, data, config).then((res) => res.data);
  }

  put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put(url, data, config).then((res) => res.data);
  }

  patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.patch(url, data, config).then((res) => res.data);
  }

  delete<T = any>(url: string, config?: any): Promise<T> {
    return this.client.delete(url, config).then((res) => res.data);
  }
}

export const apiClient = new ApiClient();

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; statusCode?: number }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 401) {
      return 'Session expired. Please log in again.';
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (axiosError.response?.status === 404) {
      return 'Resource not found.';
    }
    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection.';
    }
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
};
