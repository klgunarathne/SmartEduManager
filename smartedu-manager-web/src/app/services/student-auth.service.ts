import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

export interface DeleteUsersDto {
  usernames: string[];
}

export interface DeleteUsersResponse {
  deletedCount: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentAuthService {
  private readonly API_URL = environment.apiUrl;

  generateCredentials(dto: GenerateCredentialsDto): Observable<StudentCredentials[]> {
    return this.http.post<StudentCredentials[]>(`${this.API_URL}/students/generate-credentials`, dto).pipe(
      catchError(error => {
        console.error('Error generating credentials:', error);
        return throwError(() => error);
      })
    );
  }

  deleteUsers(usernames: string[]): Observable<DeleteUsersResponse> {
    return this.http.post<DeleteUsersResponse>(`${this.API_URL}/students/delete-users-by-usernames`, { usernames }).pipe(
      catchError(error => {
        console.error('Error deleting users:', error);
        return throwError(() => error);
      })
    );
  }

  checkUserExists(usernames: string[]): Observable<boolean[]> {
    return this.http.post<boolean[]>(`${this.API_URL}/students/check-users-exist`, { usernames }).pipe(
      catchError(error => {
        console.error('Error checking users:', error);
        return throwError(() => error);
      })
    );
  }

  constructor(private http: HttpClient) {}
}