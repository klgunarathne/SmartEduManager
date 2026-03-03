import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CreateCourseDto, UpdateCourseDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly baseUrl = 'https://localhost:7160/api/courses';

  constructor(private http: HttpClient) {}

  /**
   * Get all courses
   */
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.baseUrl);
  }

  /**
   * Get course by ID
   */
  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new course
   */
  createCourse(course: CreateCourseDto): Observable<Course> {
    return this.http.post<Course>(this.baseUrl, course);
  }

  /**
   * Update an existing course
   */
  updateCourse(id: number, course: UpdateCourseDto): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/${id}`, course);
  }

  /**
   * Delete a course
   */
  deleteCourse(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`);
  }
}
