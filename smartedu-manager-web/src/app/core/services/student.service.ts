import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student, CreateStudentDto, UpdateStudentDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly baseUrl = 'https://localhost:7160/api/students';

  constructor(private http: HttpClient) {}

  /**
   * Get all students
   */
  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseUrl);
  }

  /**
   * Get student by ID
   */
  getStudent(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get students by batch ID
   */
  getStudentsByBatch(batchId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}?batchId=${batchId}`);
  }

  /**
   * Create a new student
   */
  createStudent(student: CreateStudentDto): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, student);
  }

  /**
   * Update an existing student
   */
  updateStudent(id: number, student: UpdateStudentDto): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/${id}`, student);
  }

  /**
   * Delete a student
   */
  deleteStudent(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`);
  }
}
