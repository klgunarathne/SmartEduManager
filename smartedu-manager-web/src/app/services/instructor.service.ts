import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Instructor {
  instructorId: number;
  epfNo: string;
  fullName: string;
  nic: string;
  email: string;
  phone: string;
  centerIds: number[];
  centerNames: string[];
  courseIds: number[];
  courseNames: string[];
}

export interface CreateInstructor {
  epfNo: string;
  fullName: string;
  nic: string;
  email: string;
  phone: string;
  centerIds?: number[];
  courseIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private readonly API_URL = environment.apiUrl;

  instructors = signal<Instructor[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getInstructors(): Observable<Instructor[]> {
    this.isLoading.set(true);
    return this.http.get<Instructor[]>(`${this.API_URL}/instructors`).pipe(
      tap((data) => {
        this.instructors.set(data);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        console.error('Error loading instructors:', error);
        return throwError(() => error);
      })
    );
  }

  getInstructor(id: number): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.API_URL}/instructors/${id}`);
  }

  createInstructor(instructor: CreateInstructor): Observable<Instructor> {
    return this.http.post<Instructor>(`${this.API_URL}/instructors`, instructor).pipe(
      tap((newInstructor) => {
        this.instructors.update((instructors) => [...instructors, newInstructor]);
      }),
      catchError((error) => {
        console.error('Error creating instructor:', error);
        return throwError(() => error);
      })
    );
  }

  updateInstructor(id: number, instructor: Partial<CreateInstructor>): Observable<string> {
    return this.http.put(`${this.API_URL}/instructors/${id}`, instructor, { responseType: 'text' }).pipe(
      tap((msg) => {
        this.instructors.update((instructors) =>
          instructors.map((i) => (i.instructorId === id ? { ...i, ...instructor, centerIds: instructor.centerIds || i.centerIds, courseIds: instructor.courseIds || i.courseIds } : i))
        );
      }),
      map(() => 'Instructor updated successfully'),
      catchError((error) => {
        console.error('Error updating instructor:', error);
        return throwError(() => error);
      })
    );
  }

  deleteInstructor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/instructors/${id}`).pipe(
      tap(() => {
        this.instructors.update((instructors) => instructors.filter((i) => i.instructorId !== id));
      }),
      catchError((error) => {
        console.error('Error deleting instructor:', error);
        return throwError(() => error);
      })
    );
  }
}
