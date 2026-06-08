import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Course {
  courseId: number;
  courseName: string;
  description: string;
  duration: number;
  courseFee: number;
  centerId: number;
  centerName: string;
  instructorIds: number[];
  instructorNames: string[];
  batchIds: number[];
  batchCodes: string[];
  hasInstructors: boolean;
  hasBatches: boolean;
}

export interface CreateCourse {
  courseName: string;
  description: string;
  duration: number;
  courseFee: number;
  centerId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly API_URL = environment.apiUrl;

  courses = signal<Course[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getCourses(): Observable<Course[]> {
    this.isLoading.set(true);
    return this.http.get<Course[]>(`${this.API_URL}/courses`).pipe(
      tap(data => {
        this.courses.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading courses:', error);
        return throwError(() => error);
      })
    );
  }

  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.API_URL}/courses/${id}`);
  }

  createCourse(course: CreateCourse): Observable<Course> {
    return this.http.post<Course>(`${this.API_URL}/courses`, course).pipe(
      tap(newCourse => {
        this.courses.update(courses => [...courses, newCourse]);
      }),
      catchError(error => {
        console.error('Error creating course:', error);
        return throwError(() => error);
      })
    );
  }

  updateCourse(id: number, course: Partial<CreateCourse>): Observable<any> {
    const apiPayload: any = {};
    if (course.courseName !== undefined) apiPayload.courseName = course.courseName;
    if (course.description !== undefined) apiPayload.description = course.description;
    if (course.duration !== undefined) apiPayload.duration = course.duration;
    if (course.courseFee !== undefined) apiPayload.courseFee = course.courseFee;
    if (course.centerId !== undefined) apiPayload.centerId = course.centerId;

    return this.http.put(`${this.API_URL}/courses/${id}`, apiPayload).pipe(
      tap(() => {
        this.courses.update(courses => 
          courses.map(c => c.courseId === id ? { ...c, ...course } : c)
        );
      }),
      catchError(error => {
        console.error('Error updating course:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/courses/${id}`).pipe(
      tap(() => {
        this.courses.update(courses => courses.filter(c => c.courseId !== id));
      }),
      catchError(error => {
        console.error('Error deleting course:', error);
        return throwError(() => error);
      })
    );
  }
}
