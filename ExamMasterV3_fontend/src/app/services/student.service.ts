import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Student {
  studentId: number;
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  batchId: number;
  batchCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly API_URL = environment.apiUrl;

  students = signal<Student[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getStudentsByBatch(batchId: number): Observable<Student[]> {
    this.isLoading.set(true);
    return this.http.get<Student[]>(`${this.API_URL}/students/batch/${batchId}`).pipe(
      tap(data => {
        this.students.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading students:', error);
        return throwError(() => error);
      })
    );
  }
}