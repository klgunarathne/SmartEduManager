import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Student {
  id: number;
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  nicNo: string;
  gender: string;
  address: string;
  telephone: string;
  email: string;
  batchId: number;
  batchCode: string;
  gsDivision: string;
  agDivision: string;
}

export interface CreateStudentDto {
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  nicNo: string;
  gender: string;
  address: string;
  telephone: string;
  email?: string;
  batchId: number;
  gsDivision?: string;
  agDivision?: string;
}

export interface CsvStudentRow {
  [key: string]: string;
}

export interface CsvMapping {
  [csvHeader: string]: string;
}

export const STUDENT_FIELDS = [
  { name: 'MISNo', label: 'MIS Number', required: true },
  { name: 'NameWithInitials', label: 'Name with Initials', required: true },
  { name: 'FullName', label: 'Full Name', required: true },
  { name: 'NICNo', label: 'NIC Number', required: false },
  { name: 'Gender', label: 'Gender', required: false },
  { name: 'Address', label: 'Address', required: false },
  { name: 'Telephone', label: 'Telephone', required: false },
  { name: 'Email', label: 'Email', required: false },
  { name: 'GSDivision', label: 'GS Division', required: false },
  { name: 'AGDivision', label: 'AG Division', required: false }
];

export interface UpdateStudentDto {
  misNo?: string;
  nameWithInitials?: string;
  fullName?: string;
  nicNo?: string;
  gender?: string;
  address?: string;
  telephone?: string;
  email?: string;
  batchId?: number;
  gsDivision?: string;
  agDivision?: string;
}

interface ApiStudent {
  studentId: number;
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  nicNo: string;
  gender: string;
  address: string;
  telephone: string;
  email: string;
  batchId: number;
  batchCode: string;
  gsDivision: string;
  agDivision: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly API_URL = environment.apiUrl;

  students = signal<Student[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  private mapStudent(s: ApiStudent): Student {
    return {
      id: s.studentId,
      misNo: s.misNo,
      nameWithInitials: s.nameWithInitials,
      fullName: s.fullName,
      nicNo: s.nicNo,
      gender: s.gender,
      address: s.address,
      telephone: s.telephone,
      email: s.email,
      batchId: s.batchId,
      batchCode: s.batchCode,
      gsDivision: s.gsDivision,
      agDivision: s.agDivision
    };
  }

  private toApiCreateStudent(dto: CreateStudentDto): any {
    return {
      MISNo: dto.misNo,
      NameWithInitials: dto.nameWithInitials,
      FullName: dto.fullName,
      NICNo: dto.nicNo,
      Gender: dto.gender,
      Address: dto.address,
      Telephone: dto.telephone,
      Email: dto.email,
      BatchId: dto.batchId,
      GSDivision: dto.gsDivision,
      AGDivision: dto.agDivision
    };
  }

  private toApiUpdateStudent(dto: UpdateStudentDto): any {
    const result: any = {};
    if (dto.misNo !== undefined) result.MISNo = dto.misNo;
    if (dto.nameWithInitials !== undefined) result.NameWithInitials = dto.nameWithInitials;
    if (dto.fullName !== undefined) result.FullName = dto.fullName;
    if (dto.nicNo !== undefined) result.NICNo = dto.nicNo;
    if (dto.gender !== undefined) result.Gender = dto.gender;
    if (dto.address !== undefined) result.Address = dto.address;
    if (dto.telephone !== undefined) result.Telephone = dto.telephone;
    if (dto.email !== undefined) result.Email = dto.email;
    if (dto.batchId !== undefined) result.BatchId = dto.batchId;
    if (dto.gsDivision !== undefined) result.GSDivision = dto.gsDivision;
    if (dto.agDivision !== undefined) result.AGDivision = dto.agDivision;
    return result;
  }

  getStudents(): Observable<Student[]> {
    this.isLoading.set(true);
    return this.http.get<ApiStudent[]>(`${this.API_URL}/students`).pipe(
      map(data => data.map(s => this.mapStudent(s))),
      tap(mappedData => {
        this.students.set(mappedData);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading students:', error);
        return throwError(() => error);
      })
    );
  }

  getStudentsByBatch(batchId: number): Observable<Student[]> {
    return this.http.get<ApiStudent[]>(`${this.API_URL}/students/batch/${batchId}`).pipe(
      map(data => data.map(s => this.mapStudent(s))),
      tap(mappedData => {
        this.students.set(mappedData);
      }),
      catchError(error => {
        console.error('Error loading students by batch:', error);
        return throwError(() => error);
      })
    );
  }

  getStudent(id: number): Observable<Student> {
    return this.http.get<ApiStudent>(`${this.API_URL}/students/${id}`).pipe(
      map(data => this.mapStudent(data))
    );
  }

  createStudent(dto: CreateStudentDto): Observable<Student> {
    return this.http.post<ApiStudent>(`${this.API_URL}/students`, this.toApiCreateStudent(dto)).pipe(
      map(data => this.mapStudent(data)),
      tap(created => {
        this.students.update(list => [...list, created]);
      }),
      catchError(error => {
        console.error('Error creating student:', error);
        return throwError(() => error);
      })
    );
  }

  updateStudent(id: number, dto: UpdateStudentDto): Observable<string> {
    return this.http.put<string>(`${this.API_URL}/students/${id}`, this.toApiUpdateStudent(dto)).pipe(
      tap(() => {
        this.students.update(list => 
          list.map(s => s.id === id ? { ...s, ...dto, id: s.id, batchCode: s.batchCode } : s)
        );
      }),
      catchError(error => {
        console.error('Error updating student:', error);
        return throwError(() => error);
      })
    );
  }

  deleteStudent(id: number): Observable<string> {
    return this.http.delete<string>(`${this.API_URL}/students/${id}`).pipe(
      tap(() => {
        this.students.update(list => list.filter(s => s.id !== id));
      }),
      catchError(error => {
        console.error('Error deleting student:', error);
        return throwError(() => error);
      })
    );
  }
}
