import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: UserDto;
}

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: Date;
  imageUrl?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;

  private accessTokenValue: string | null = null;
  private refreshTokenValue: string | null = null;

  currentUser = signal<UserDto | null>(null);
  isAuthenticated = signal<boolean>(false);

  private readonly ACCESS_TOKEN_KEY = 'smartedu_access_token';
  private readonly REFRESH_TOKEN_KEY = 'smartedu_refresh_token';
  private readonly USER_KEY = 'smartedu_user';

  constructor(private http: HttpClient, private router: Router) {
    this.initAuthState();
  }

  initAuthState(): void {
    try {
      const storedAccessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(this.USER_KEY);

      if (storedAccessToken) this.accessTokenValue = storedAccessToken;
      if (storedRefreshToken) this.refreshTokenValue = storedRefreshToken;
      if (storedUser) {
        try {
          this.currentUser.set(JSON.parse(storedUser) as UserDto);
        } catch {
          this.currentUser.set(null);
        }
      }
    } catch {
      // ignore storage access errors (e.g., private mode restrictions)
    }
  }

  login(credentials: LoginDto): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken, response.user);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  refreshAccessToken(): Observable<TokenResponse> {
    const refreshToken = this.refreshToken();
    const accessToken = this.accessToken();

    if (!refreshToken || !accessToken) {
      return throwError(() => new Error('Refresh token is not available'));
    }

    return this.http.post<TokenResponse>(`${this.API_URL}/auth/refresh-token`, { accessToken, refreshToken }).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken, response.user);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  private setTokens(accessToken: string, refreshToken: string, user?: UserDto): void {
    this.accessTokenValue = accessToken;
    this.refreshTokenValue = refreshToken;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private clearAuth(): void {
    this.accessTokenValue = null;
    this.refreshTokenValue = null;
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return this.accessToken();
  }

  refreshToken(): string | null {
    return this.refreshTokenValue ?? localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearAuthPublic(): void {
    this.clearAuth();
  }

  isTokenExpiredPublic(token: string): boolean {
    return this.isTokenExpired(token);
  }

  accessToken(): string | null {
    return this.accessTokenValue ?? localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  checkAuthStatus(): boolean {
    const token = this.accessToken();
    return !!token && !this.isTokenExpired(token);
  }

  getUser(): UserDto | null {
    return this.currentUser();
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.roles.includes(role) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  isInstructor(): boolean {
    return this.hasRole('Instructor');
  }

  isStudent(): boolean {
    return this.hasRole('Student');
  }

  private isTokenExpired(token: string): boolean {
    const payload = token.split('.')[1];
    if (!payload) {
      return true;
    }

    try {
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded.exp ? decoded.exp * 1000 <= Date.now() : true;
    } catch {
      return true;
    }
  }
}
