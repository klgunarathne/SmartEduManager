import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentCredentials {
  studentId: number;
  studentName: string;
  username: string;
  password: string;
  email: string;
  status: string;
}

export interface GenerateCredentialsDto {
  batchId?: number;
  studentIds?: number[];
  defaultPassword?: string;
  generateRandomPassword?: boolean;
  sendEmail?: boolean;
}

export interface StudentLoginDto {
  username: string;
  password: string;
  isStudentLogin?: boolean;
}

export interface StudentUser {
  id?: number;
  studentId?: number;
  firstName?: string;
  lastName?: string;
  nameWithInitials?: string;
  fullName?: string;
  email?: string;
  username?: string;
  misNo?: string;
  batchId?: number;
  batchCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentAuthService {
  private readonly API_URL = environment.apiUrl;

  studentUser = signal<StudentUser | null>(null);
  isAuthenticated = signal(false);

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.isAuthenticated.set(true);
      const stored = localStorage.getItem('student_user');
      if (stored) {
        try {
          this.studentUser.set(JSON.parse(stored));
        } catch {
          this.studentUser.set(null);
        }
      }
    }
  }

  generateCredentials(dto: GenerateCredentialsDto): Observable<StudentCredentials[]> {
    return this.http.post<StudentCredentials[]>(`${this.API_URL}/students/generate-credentials`, dto).pipe(
      catchError(error => {
        console.error('Error generating credentials:', error);
        return throwError(() => error);
      })
    );
  }

  login(credentials: StudentLoginDto): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, {
      email: credentials.username,
      password: credentials.password,
      isStudentLogin: true
    }).pipe(
      tap((response) => {
        const baseUser: StudentUser = {
          id: response.user?.id,
          firstName: response.user?.firstName,
          lastName: response.user?.lastName,
          fullName: response.user?.fullName,
          email: response.user?.email,
          username: response.user?.username,
        };
        this.studentUser.set(baseUser);
        this.isAuthenticated.set(true);
        localStorage.setItem('access_token', response.accessToken);
        
        this.fetchStudentDetails(credentials.username, baseUser).subscribe({
          next: (student) => {
            const fullUser = { ...baseUser, ...student };
            this.studentUser.set(fullUser);
            localStorage.setItem('student_user', JSON.stringify(fullUser));
          },
          error: (err) => {
            console.log('Could not fetch student details:', err);
            localStorage.setItem('student_user', JSON.stringify(baseUser));
          }
        });
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  fetchStudentDetails(username: string, baseUser: StudentUser): Observable<Partial<StudentUser>> {
    return this.http.get<any>(`${this.API_URL}/students/by-nic/${username}`).pipe(
      catchError(() => {
        return this.http.get<any>(`${this.API_URL}/students/by-mis/${baseUser.id}`);
      })
    );
  }

  checkBackend(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`).pipe(
      catchError(error => {
        return throwError(() => new Error('Backend not reachable'));
      })
    );
  }

  logout(): void {
    this.studentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('student_user');
  }

  clearSession(): void {
    this.studentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('student_user');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getStudentUser(): StudentUser | null {
    if (!this.studentUser()) {
      const stored = localStorage.getItem('student_user');
      if (stored) {
        this.studentUser.set(JSON.parse(stored));
      }
    }
    return this.studentUser();
  }
}