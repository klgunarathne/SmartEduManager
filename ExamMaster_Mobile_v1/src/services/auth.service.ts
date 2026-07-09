import { apiClient } from './api-client';
import { storage } from './storage.service';
import { LoginDto, AuthResponse, StudentUser, RefreshTokenDto } from '@/models/auth.models';
import { StudentDto } from '@/models/student.models';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://smartedumanagerapi.somee.com/api';

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
      user: { id: string; firstName: string; lastName: string; email: string; roles: string[] };
    }>('/Auth/login', dto);

    const { accessToken, refreshToken, expiresAt, user } = response;
    await storage.setToken(accessToken);
    await storage.setRefreshToken(refreshToken);

    let studentUser: StudentUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles || [],
    };

    try {
      const studentResponse = await apiClient.get<StudentDto>(`/Students/by-nic/${encodeURIComponent(dto.email)}`);
      studentUser = {
        ...studentUser,
        studentId: studentResponse.studentId,
        misNo: studentResponse.misNo,
        fullName: studentResponse.fullName,
        nicNo: studentResponse.nicNo,
        gender: studentResponse.gender,
        address: studentResponse.address,
        telephone: studentResponse.telephone,
        batchId: studentResponse.batchId,
        batchCode: studentResponse.batchCode,
        gsDivision: studentResponse.gsDivision,
        agDivision: studentResponse.agDivision,
        studentNumber: studentResponse.studentNumber,
      };
    } catch {
    }

    await storage.setUser(studentUser);
    return { token: { accessToken, refreshToken, expiresAt }, user: studentUser };
  },

  async refreshToken(dto: RefreshTokenDto): Promise<TokenDto> {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string; expiresAt: string }>(
      '/Auth/refresh-token',
      dto
    );
    await storage.setToken(response.accessToken);
    await storage.setRefreshToken(response.refreshToken);
    return response;
  },

  async logout(): Promise<void> {
    await storage.clearAll();
  },

  async restoreSession(): Promise<StudentUser | null> {
    const token = await storage.getToken();
    if (!token) return null;

    try {
      const userJson = await storage.getUser();
      if (userJson) {
        return JSON.parse(userJson) as StudentUser;
      }
      return null;
    } catch {
      return null;
    }
  },

  async getProfile(): Promise<StudentUser | null> {
    try {
      const userJson = await storage.getUser();
      if (userJson) {
        return JSON.parse(userJson) as StudentUser;
      }
      return null;
    } catch {
      return null;
    }
  },
};
