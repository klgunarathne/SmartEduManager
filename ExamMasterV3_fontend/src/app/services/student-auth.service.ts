import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiLoginResponse,
  ApiUserDto,
  StudentUser
} from '../models/exam.models';

@Injectable({
  providedIn: 'root'
})
export class StudentAuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly tokenKey = 'exam-master-access-token';
  private readonly refreshTokenKey = 'exam-master-refresh-token';
  private readonly userKey = 'exam-master-student-user';

  currentUser = signal<StudentUser | null>(null);
  isAuthenticated = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  login(username: string, password: string): Observable<StudentUser> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<ApiLoginResponse>(`${this.API_URL}/auth/login`, {
      email: username.trim(),
      password,
      isStudentLogin: true
    }).pipe(
      tap(response => {
        const user = this.mapUser(response.user ?? response.User);
        const baseUser: StudentUser = {
          ...user,
          username: username.trim(),
          misNo: username.trim()
        };

        this.currentUser.set(baseUser);
        this.isAuthenticated.set(true);
        localStorage.setItem(this.tokenKey, response.accessToken ?? response.AccessToken ?? '');
        localStorage.setItem(this.refreshTokenKey, response.refreshToken ?? response.RefreshToken ?? '');
        localStorage.setItem(this.userKey, JSON.stringify(baseUser));
      }),
      switchMap(response => {
        const baseUser = this.currentUser();

        return this.fetchStudentDetails(username).pipe(
          map(student => {
            const mergedUser = { ...(baseUser ?? {}), ...student };
            this.currentUser.set(mergedUser);
            localStorage.setItem(this.userKey, JSON.stringify(mergedUser));
            return mergedUser;
          }),
          catchError(() => {
            const mergedUser = { ...(baseUser ?? {}), username: username.trim(), misNo: username.trim() };
            this.currentUser.set(mergedUser);
            localStorage.setItem(this.userKey, JSON.stringify(mergedUser));
            return of(mergedUser);
          })
        );
      }),
      catchError(error => {
        this.error.set(this.extractErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  fetchStudentDetails(username: string): Observable<Partial<StudentUser>> {
    return this.http.get<Partial<StudentUser>>(`${this.API_URL}/students/by-nic/${encodeURIComponent(username.trim())}`);
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  clearSession(): void {
    this.logout();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): StudentUser | null {
    if (!this.currentUser()) {
      const stored = localStorage.getItem(this.userKey);
      if (stored) {
        try {
          this.currentUser.set(JSON.parse(stored));
        } catch {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
        }
      }
    }

    return this.currentUser();
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      return;
    }

    this.isAuthenticated.set(true);
    this.getCurrentUser();
  }

  private mapUser(user: ApiUserDto | undefined): StudentUser {
    return {
      id: user?.id ?? user?.Id,
      firstName: user?.firstName ?? user?.FirstName,
      lastName: user?.lastName ?? user?.LastName,
      email: user?.email ?? user?.Email,
      username: user?.username ?? user?.Username,
      roles: user?.roles ?? user?.Roles
    };
  }

  private extractErrorMessage(error: HttpErrorResponse | unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Unable to connect to the exam server. Please check your network or API URL.';
      }

      if (typeof error.error === 'string') {
        return error.error;
      }

      if (error.error?.message) {
        return error.error.message;
      }

      if (Array.isArray(error.error?.errors)) {
        return error.error.errors.map((item: { description?: string }) => item.description).filter(Boolean).join(' ');
      }
    }

    return 'Something went wrong. Please try again.';
  }
}
