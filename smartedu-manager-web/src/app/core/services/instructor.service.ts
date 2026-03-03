import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Instructor, CreateInstructorDto, UpdateInstructorDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private readonly baseUrl = 'https://localhost:7160/api/instructors';

  constructor(private http: HttpClient) {}

  /**
   * Get all instructors
   */
  getInstructors(): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(this.baseUrl);
  }

  /**
   * Get instructor by ID
   */
  getInstructor(id: number): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new instructor
   */
  createInstructor(instructor: CreateInstructorDto): Observable<Instructor> {
    return this.http.post<Instructor>(this.baseUrl, instructor);
  }

  /**
   * Update an existing instructor
   */
  updateInstructor(id: number, instructor: UpdateInstructorDto): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/${id}`, instructor);
  }

  /**
   * Delete an instructor
   */
  deleteInstructor(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`);
  }
}
