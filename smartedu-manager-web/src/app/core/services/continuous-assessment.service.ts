import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContinuousAssessment, CreateContinuousAssessmentDto, UpdateContinuousAssessmentDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContinuousAssessmentService {
  private readonly baseUrl = 'https://localhost:7160/api/ContinuousAssessments';

  constructor(private http: HttpClient) {}

  /**
   * Get all continuous assessments
   */
  getAllAssessments(): Observable<ContinuousAssessment[]> {
    return this.http.get<ContinuousAssessment[]>(this.baseUrl);
  }

  /**
   * Get assessment by ID
   */
  getAssessment(id: number): Observable<ContinuousAssessment> {
    return this.http.get<ContinuousAssessment>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get assessments by student ID
   */
  getAssessmentsByStudent(studentId: number): Observable<ContinuousAssessment[]> {
    return this.http.get<ContinuousAssessment[]>(`${this.baseUrl}/student/${studentId}`);
  }

  /**
   * Get assessments by batch ID
   */
  getAssessmentsByBatch(batchId: number): Observable<ContinuousAssessment[]> {
    return this.http.get<ContinuousAssessment[]>(`${this.baseUrl}/batch/${batchId}`);
  }

  /**
   * Get assessments by course ID
   */
  getAssessmentsByCourse(courseId: number): Observable<ContinuousAssessment[]> {
    return this.http.get<ContinuousAssessment[]>(`${this.baseUrl}/course/${courseId}`);
  }

  /**
   * Get assessments by module task ID
   */
  getAssessmentsByModuleTask(moduleTaskId: number): Observable<ContinuousAssessment[]> {
    return this.http.get<ContinuousAssessment[]>(`${this.baseUrl}/moduletask/${moduleTaskId}`);
  }

  /**
   * Create a new assessment
   */
  createAssessment(assessment: CreateContinuousAssessmentDto): Observable<ContinuousAssessment> {
    return this.http.post<ContinuousAssessment>(this.baseUrl, assessment);
  }

  /**
   * Update an existing assessment
   */
  updateAssessment(id: number, assessment: UpdateContinuousAssessmentDto): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/${id}`, assessment);
  }

  /**
   * Update assessment by student and task
   */
  updateAssessmentByStudentAndTask(studentId: number, moduleTaskId: number, assessment: UpdateContinuousAssessmentDto): Observable<string | ContinuousAssessment> {
    return this.http.put<string | ContinuousAssessment>(`${this.baseUrl}/student/${studentId}/task/${moduleTaskId}`, assessment);
  }

  /**
   * Delete an assessment
   */
  deleteAssessment(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`);
  }
}
