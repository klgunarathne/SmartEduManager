import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://localhost:7160/api';
  private tokenKey = 'smartedu-token';
  private refreshTokenKey = 'smartedu-refreshToken';
  private expiresAtKey = 'smartedu-expiresAt';
  private roleKey = 'smartedu-role';
  private fullNameKey = 'smartedu-fullName';
  private firstNameKey = 'smartedu-firstName';

  private _isLoggedIn = signal<boolean>(this.hasToken());
  userRole = signal<string>(localStorage.getItem(this.roleKey) || '');
  userFullName = signal<string>(localStorage.getItem(this.fullNameKey) || '');
  userFirstName = signal<string>(localStorage.getItem(this.firstNameKey) || '');

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/Auth/login`, request).pipe(
      tap((response) => {
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
        this.setExpiresAt(response.expiresAt);
        // Extract role and full name from JWT token
        const decodedToken = this.decodeToken(response.accessToken);
        if (decodedToken) {
          const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken['role'];
          const email = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decodedToken['email'];
          const firstName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || decodedToken['given_name'] || decodedToken['FirstName'];
          this.setRole(role);
          this.setFullName(email); // Use email as fallback if full name not available
          this.userRole.set(role);
          this.userFullName.set(email);
          this.setFirstName(firstName);
        }
        this._isLoggedIn.set(true);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const request: RefreshTokenRequest = {
      accessToken: this.getToken()!,
      refreshToken: this.getRefreshToken()!
    };
    
    return this.http.post<LoginResponse>(`${this.baseUrl}/Auth/refresh-token`, request).pipe(
      tap((response) => {
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
        this.setExpiresAt(response.expiresAt);
        // Extract role and full name from JWT token
        const decodedToken = this.decodeToken(response.accessToken);
        if (decodedToken) {
          const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken['role'];
          const email = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decodedToken['email'];
          const firstName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || decodedToken['given_name'] || decodedToken['FirstName'];
          this.setRole(role);
          this.setFullName(email); // Use email as fallback if full name not available
          this.userRole.set(role);
          this.userFullName.set(email);
          this.setFirstName(firstName);
        }
      })
    );
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.expiresAtKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.fullNameKey);
    localStorage.removeItem(this.firstNameKey);
    this._isLoggedIn.set(false);
    this.userRole.set('');
    this.userFullName.set('');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  private setExpiresAt(expiresAt: string): void {
    localStorage.setItem(this.expiresAtKey, expiresAt);
  }

  private setRole(role: string): void {
    localStorage.setItem(this.roleKey, role);
  }

  private setFullName(fullName: string): void {
    localStorage.setItem(this.fullNameKey, fullName);
  }

  private setFirstName(firstName: string): void {
    localStorage.setItem(this.firstNameKey, firstName);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getExpiresAt(): string | null {
    return localStorage.getItem(this.expiresAtKey);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }
}