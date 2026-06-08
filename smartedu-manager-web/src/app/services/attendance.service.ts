import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Attendance {
  attendanceId: number;
  studentId: number;
  studentName: string;
  misNo: string;
  batchId: number;
  batchCode: string;
  date: string;
  isPresent: boolean;
  remarks?: string;
}

export interface CreateAttendanceDto {
  studentId: number;
  batchId: number;
  date: string;
  isPresent: boolean;
  remarks?: string;
}

export interface UpdateAttendanceDto {
  isPresent?: boolean;
  remarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly API_URL = environment.apiUrl;

  attendances = signal<Attendance[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getAttendanceByBatch(batchId: number): Observable<Attendance[]> {
    this.isLoading.set(true);
    return this.http.get<Attendance[]>(`${this.API_URL}/attendance/batch/${batchId}`).pipe(
      tap(data => {
        this.attendances.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading attendance:', error);
        return throwError(() => error);
      })
    );
  }

  createAttendance(dto: CreateAttendanceDto): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.API_URL}/attendance`, dto).pipe(
      tap(newAttendance => {
        this.attendances.update(list => [...list, newAttendance]);
      }),
      catchError(error => {
        console.error('Error creating attendance:', error);
        return throwError(() => error);
      })
    );
  }

  updateAttendance(id: number, dto: UpdateAttendanceDto): Observable<string> {
    const apiPayload: any = {};
    if (dto.isPresent !== undefined) apiPayload.isPresent = dto.isPresent;
    if (dto.remarks !== undefined) apiPayload.remarks = dto.remarks;

    return this.http.put(`${this.API_URL}/attendance/${id}`, apiPayload, { responseType: 'text' }).pipe(
      tap(() => {
        this.attendances.update(list =>
          list.map(a => a.attendanceId === id ? { ...a, ...dto } : a)
        );
      }),
      catchError(error => {
        console.error('Error updating attendance:', error);
        return throwError(() => error);
      })
    );
  }

  deleteAttendance(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/attendance/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.attendances.update(list => list.filter(a => a.attendanceId !== id));
      }),
      catchError(error => {
        console.error('Error deleting attendance:', error);
        return throwError(() => error);
      })
    );
  }

  markAttendance(studentId: number, batchId: number, date: string, isPresent: boolean): Observable<Attendance> {
    const dto: CreateAttendanceDto = { studentId, batchId, date, isPresent };
    return this.createAttendance(dto);
  }
}