import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Assignment, CreateAssignmentDto, UpdateAssignmentDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly baseUrl = 'https://localhost:7160/api/assignments';

  constructor(private http: HttpClient) {}

  /**
   * Get all assignments
   */
  getAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(this.baseUrl);
  }

  /**
   * Get assignment by ID
   */
  getAssignment(id: number): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get assignments by course ID
   */
  getAssignmentsByCourse(courseId: number): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.baseUrl}?courseId=${courseId}`);
  }

  /**
   * Create a new assignment
   */
  createAssignment(assignment: CreateAssignmentDto): Observable<Assignment> {
    return this.http.post<Assignment>(this.baseUrl, assignment);
  }

  /**
   * Update an existing assignment
   */
  updateAssignment(id: number, assignment: UpdateAssignmentDto): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/${id}`, assignment);
  }

  /**
   * Delete an assignment
   */
  deleteAssignment(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`);
  }
}
