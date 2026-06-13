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

  constructor(private http: HttpClient) {}
}