export interface LoginDto {
  email: string;
  password: string;
  isStudentLogin?: boolean;
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenDto {
  accessToken: string;
  refreshToken: string;
}

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  imageUrl?: string;
  roles: string[];
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  token: TokenDto;
  user: UserDto;
}

export interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
  studentId?: string;
  misNo?: string;
  batchCode?: string;
  fullName?: string;
  nicNo?: string;
  gender?: string;
  address?: string;
  telephone?: string;
  batchId?: string;
  gsDivision?: string;
  agDivision?: string;
  studentNumber?: string;
}
