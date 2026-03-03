import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseInstructor } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CourseInstructorService {
  private readonly baseUrl = 'https://localhost:7160/api/CourseInstructors';

  constructor(private http: HttpClient) {}

  /**
   * Get all course-instructor relationships
   */
  getCourseInstructors(): Observable<CourseInstructor[]> {
    return this.http.get<CourseInstructor[]>(this.baseUrl);
  }

  /**
   * Get course-instructor by IDs
   */
  getCourseInstructor(courseId: number, instructorId: number): Observable<CourseInstructor> {
    return this.http.get<CourseInstructor>(`${this.baseUrl}/${courseId}/${instructorId}`);
  }

  /**
   * Get instructors by course
   */
  getInstructorsByCourse(courseId: number): Observable<CourseInstructor[]> {
    return this.http.get<CourseInstructor[]>(`${this.baseUrl}?courseId=${courseId}`);
  }

  /**
   * Get courses by instructor
   */
  getCoursesByInstructor(instructorId: number): Observable<CourseInstructor[]> {
    return this.http.get<CourseInstructor[]>(`${this.baseUrl}?instructorId=${instructorId}`);
  }

  /**
   * Create course-instructor relationship
   */
  createCourseInstructor(courseInstructor: { courseId: number; instructorId: number }): Observable<CourseInstructor> {
    return this.http.post<CourseInstructor>(this.baseUrl, courseInstructor);
  }

  /**
   * Delete course-instructor relationship
   */
  deleteCourseInstructor(courseId: number, instructorId: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${courseId}/${instructorId}`);
  }
}
