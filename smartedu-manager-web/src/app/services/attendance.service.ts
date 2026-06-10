import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
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

export interface AttendanceRecordMap {
  [key: string]: { [studentId: number]: Attendance };
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

export interface BatchAttendanceSummary {
  studentId: number;
  studentName: string;
  misNo: string;
  totalDays: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export interface StudentAttendanceSummary {
  studentId: number;
  studentName: string;
  misNo: string;
  batchId: number;
  batchCode: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

export interface MonthlyAttendanceDay {
  date: string;
  day: number;
  status: 'present' | 'absent' | 'no-class' | 'none';
}

export interface MonthlyAttendanceData {
  studentId: number;
  studentName: string;
  year: number;
  month: number;
  days: MonthlyAttendanceDay[];
  totalDays: number;
  presentDays: number;
  absentDays: number;
  noClassDays: number;
  attendancePercentage: number;
}

export interface CourseCompletionReport {
  batchId: number;
  batchCode: string;
  courseId: number;
  courseName: string;
  minimumRequiredPercentage: number;
  studentReports: StudentAttendanceSummary[];
}

export interface DailyReportFilter {
  batchId: number;
  date: string;
}

export interface MonthlyReportFilter {
  batchId: number;
  month: number;
  year: number;
}

export interface StudentReportFilter {
  studentId: number;
  startDate?: string;
  endDate?: string;
}

export interface Settings {
  minimumAttendancePercentage: number;
  presentColor: string;
  absentColor: string;
  noClassColor: string;
  workingDays: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly API_URL = environment.apiUrl;

  attendances = signal<Attendance[]>([]);
  isLoading = signal(false);
  settings = signal<Settings>({
    minimumAttendancePercentage: 75,
    presentColor: '#22c55e',
    absentColor: '#ef4444',
    noClassColor: '#9ca3af',
    workingDays: [1, 2, 3, 4, 5, 6]
  });

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

  getAttendanceByDate(batchId: number, date: string): Observable<Attendance[]> {
    return this.getAttendanceByBatch(batchId).pipe(
      map(data => data.filter(a => a.date && a.date.startsWith(date))),
      catchError(error => {
        console.error('Error loading attendance by date:', error);
        return throwError(() => error);
      })
    );
  }

  getBatchAttendanceSummary(batchId: number, startDate: string, endDate: string): Observable<BatchAttendanceSummary[]> {
    this.isLoading.set(true);
    return this.http.get<BatchAttendanceSummary[]>(`${this.API_URL}/attendance/batch/${batchId}/summary?startDate=${startDate}&endDate=${endDate}`).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading attendance summary:', error);
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

  updateAttendanceByStudent(date: string, studentId: number, batchId: number, isPresent: boolean): Observable<string> {
    const apiPayload = { isPresent };
    return this.http.put(`${this.API_URL}/attendance/day/${date}/student/${studentId}/batch/${batchId}`, apiPayload, { responseType: 'text' }).pipe(
      tap(() => {
        this.attendances.update(list =>
          list.map(a => 
            (a.date === date && a.studentId === studentId && a.batchId === batchId) 
              ? { ...a, isPresent } 
              : a
          )
        );
      }),
      catchError(error => {
        console.error('Error updating attendance:', error);
        return throwError(() => error);
      })
    );
  }

  deleteAttendanceByStudent(date: string, studentId: number, batchId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/attendance/day/${date}/student/${studentId}/batch/${batchId}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.attendances.update(list => 
          list.filter(a => !(a.date === date && a.studentId === studentId))
        );
      }),
      catchError(error => {
        console.error('Error deleting attendance:', error);
        return throwError(() => error);
      })
    );
  }

  clearAttendanceForDay(date: string, batchId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/attendance/day/${date}/batch/${batchId}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.attendances.update(list => list.filter(a => a.date !== date));
      }),
      catchError(error => {
        console.error('Error clearing attendance for day:', error);
        return throwError(() => error);
      })
    );
  }

  clearAttendanceForBatch(batchId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/attendance/batch/${batchId}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.attendances.update(list => list.filter(a => a.batchId !== batchId));
      }),
      catchError(error => {
        console.error('Error clearing attendance for batch:', error);
        return throwError(() => error);
      })
    );
  }

  getMonthlyAttendance(studentId: number, year: number, month: number): Observable<MonthlyAttendanceData> {
    return new Observable(observer => {
      const attendances = this.attendances();
      const monthStr = String(month + 1).padStart(2, '0');
      const monthAttendances = attendances.filter(a => 
        a.studentId === studentId && a.date.startsWith(`${year}-${monthStr}`)
      );
      
      const data = this.buildMonthlyData(monthAttendances, studentId, year, month);
      observer.next(data);
      observer.complete();
    });
  }

getMonthlyAttendanceFromBatch(studentId: number, batchId: number, year: any, month: any): Observable<MonthlyAttendanceData> {
    this.isLoading.set(true);
    const numericMonth = typeof month === 'string' ? parseInt(month, 10) : (typeof month === 'number' ? month : 0);
    const numericYear = typeof year === 'string' ? parseInt(year, 10) : (typeof year === 'number' ? year : 2026);
    const monthStr = String(numericMonth + 1).padStart(2, '0');
    return this.http.get<Attendance[]>(`${this.API_URL}/attendance/batch/${batchId}`).pipe(
      map((attendances) => {
        console.log('Raw attendance dates:', attendances.map(a => a.date));
        // Normalize dates in attendances to padded format for consistent matching
        const normalizedAttendances = attendances.map(a => ({
          ...a,
          date: this.normalizeDate(a.date)
        }));
        const monthAttendances = normalizedAttendances.filter(a => a.date.startsWith(`${numericYear}-${monthStr}`));
        console.log('Monthly attendance request:', { studentId, year: numericYear, month: numericMonth, monthStr, total: attendances.length, filtered: monthAttendances.length });
        return this.buildMonthlyData(monthAttendances, studentId, numericYear, numericMonth);
      }),
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading monthly attendance:', error);
        return throwError(() => error);
      })
    );
  }

  private buildMonthlyData(attendances: Attendance[], studentId: number, year: any, month: number): MonthlyAttendanceData {
    const numericYear = typeof year === 'string' ? parseInt(year, 10) : year;
    const monthStr = String(month + 1).padStart(2, '0');
    
    const daysInMonth = new Date(numericYear, month + 1, 0).getDate();
    const workingDays = this.settings().workingDays;
    const student = attendances.find(a => a.studentId === studentId);
    
    const days: MonthlyAttendanceDay[] = [];
    let presentDays = 0;
    let absentDays = 0;
    let noClassDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(numericYear, month, day);
      const dateStrPadded = `${numericYear}-${monthStr}-${String(day).padStart(2, '0')}`;
      const attendance = attendances.find(a => a.studentId === studentId && a.date === dateStrPadded);
      
      let status: 'present' | 'absent' | 'no-class' | 'none' = 'none';
      if (attendance) {
        status = attendance.isPresent ? 'present' : 'absent';
      } else if (!workingDays.includes(date.getDay())) {
        status = 'no-class';
      }
      
      days.push({ date: dateStrPadded, day, status });
      
      if (status === 'present') presentDays++;
      else if (status === 'absent') absentDays++;
      else if (status === 'no-class') noClassDays++;
    }
    
    console.log('Build monthly data result:', { dateStr: `${numericYear}-${monthStr}-01`, daysWithStatus: days.filter(d => d.status !== 'none' && d.status !== 'no-class').length, presentDays, absentDays });
    
    const totalDays = presentDays + absentDays;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    return {
      studentId,
      studentName: student?.studentName || '',
      year: numericYear,
      month,
      days,
      totalDays,
      presentDays,
      absentDays,
      noClassDays,
      attendancePercentage
    };
  }

  getStudentAttendanceSummary(studentId: number, startDate?: string, endDate?: string): Observable<StudentAttendanceSummary> {
    return this.http.get<BatchAttendanceSummary[]>(`${this.API_URL}/attendance/batch/summary`).pipe(
      map(data => {
        const student = data.find(s => s.studentId === studentId);
        if (!student) {
          return {
            studentId,
            studentName: '',
            misNo: '',
            batchId: 0,
            batchCode: '',
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            attendancePercentage: 0
          };
        }
        return {
          studentId,
          studentName: student.studentName,
          misNo: student.misNo,
          batchId: 0,
          batchCode: '',
          totalDays: student.totalDays,
          presentDays: student.presentCount,
          absentDays: student.absentCount,
          attendancePercentage: student.attendancePercentage
        };
      }),
      catchError(error => {
        console.error('Error loading student attendance summary:', error);
        return throwError(() => error);
      })
    );
  }

  generateCourseCompletionReport(batchId: number): Observable<CourseCompletionReport> {
    return this.http.get<CourseCompletionReport>(`${this.API_URL}/attendance/batch/${batchId}/completion-report`).pipe(
      catchError(error => {
        console.error('Error generating course completion report:', error);
        return throwError(() => error);
      })
    );
  }

  getDailyReport(filter: DailyReportFilter): Observable<Attendance[]> {
    this.isLoading.set(true);
    return this.http.get<Attendance[]>(`${this.API_URL}/attendance/report/daily`, {
      params: {
        batchId: filter.batchId,
        date: filter.date
      }
    }).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error generating daily report:', error);
        return throwError(() => error);
      })
    );
  }

  getMonthlyReport(filter: MonthlyReportFilter): Observable<BatchAttendanceSummary[]> {
    this.isLoading.set(true);
    return this.http.get<BatchAttendanceSummary[]>(`${this.API_URL}/attendance/report/monthly`, {
      params: {
        batchId: filter.batchId,
        month: filter.month,
        year: filter.year
      }
    }).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error generating monthly report:', error);
        return throwError(() => error);
      })
    );
  }

  getStudentReport(filter: StudentReportFilter): Observable<StudentAttendanceSummary> {
    let params = new HttpParams();
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    
    return this.http.get<StudentAttendanceSummary>(`${this.API_URL}/attendance/report/student/${filter.studentId}`, { params }).pipe(
      catchError(error => {
        console.error('Error generating student report:', error);
        return throwError(() => error);
      })
    );
  }

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`${this.API_URL}/settings/attendance`).pipe(
      tap(data => this.settings.set(data)),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  updateSettings(settings: Settings): Observable<Settings> {
    return this.http.put<Settings>(`${this.API_URL}/settings/attendance`, settings).pipe(
      tap(data => this.settings.set(data)),
      catchError(error => {
        console.error('Error updating settings:', error);
        return throwError(() => error);
      })
    );
  }

  calculateAttendancePercentage(presentDays: number, totalDays: number): number {
    if (totalDays === 0) return 0;
    return Math.round((presentDays / totalDays) * 100);
  }

  private normalizeDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].split('T')[0].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  isEligible(attendancePercentage: number): boolean {
    return attendancePercentage >= this.settings().minimumAttendancePercentage;
  }
}