import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

export interface SessionItem {
  itemId: number;
  appointmentId: number;
  title: string;
  description?: string;
  itemType: 'Task' | 'Note' | 'Resource' | 'Assignment';
  isCompleted: boolean;
  dueDateTime?: string;
  createdAt: string;
}

export interface CourseSession {
  appointmentId: number;
  text: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  recurrenceRule?: string;
  recurrenceException?: string;
  sessionType?: string;
  status?: string;
  isPublished: boolean;
  color?: string;
  courseId?: number;
  courseName?: string;
  batchId: number;
  batchCode?: string;
  instructorId?: number;
  instructorName?: string;
  centerId?: number;
  centerName?: string;
  moduleId?: number;
  moduleName?: string;
  createdAt: string;
  updatedAt?: string;
  taskNo?: string;
  taskName?: string;
  items: SessionItem[];
}

export interface CreateSessionDto {
  text: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  recurrenceRule?: string;
  recurrenceException?: string;
  sessionType?: string;
  status?: string;
  isPublished?: boolean;
  color?: string;
  courseId?: number;
  batchId: number;
  instructorId?: number;
  centerId?: number;
  moduleId?: number;
  addModuleTasks?: boolean;
  taskNo?: string;
  taskName?: string;
  items?: SessionItem[];
}

export interface UpdateSessionDto {
  text?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  allDay?: boolean;
  recurrenceRule?: string;
  recurrenceException?: string;
  sessionType?: string;
  status?: string;
  isPublished?: boolean;
  color?: string;
  courseId?: number;
  batchId?: number;
  instructorId?: number;
  centerId?: number;
  moduleId?: number;
  addModuleTasks?: boolean;
  taskNo?: string;
  taskName?: string;
  items?: SessionItem[];
}

export interface ConflictCheckRequest {
  batchId: number;
  startDateTime: string;
  endDateTime: string;
  instructorId?: number;
  centerId?: number;
  excludeSessionId?: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: Array<{
    appointmentId: number;
    text: string;
    startDateTime: string;
    endDateTime: string;
    conflictType: string;
  }>;
}

export interface GenerateTimetableRequest {
  batchId: number;
  startDate: string;
  endDate: string;
  excludedDays: number[];
  modules: Array<{
    moduleId: number;
    moduleName: string;
    theoryHours: number;
    practicalHours: number;
    sessionDurationMinutes: number;
  }>;
  instructorId?: number;
  centerId?: number;
}

export interface TimetableQueryParams {
  batchId?: number;
  start?: string;
  end?: string;
}

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class CourseScheduleService {
  sessions = signal<CourseSession[]>([]);
  batches = signal<Array<{ batchId: number; batchCode: string; courseName: string }>>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient, private toast: ToastService) {}

  loadBatches(): Observable<any> {
    return this.http.get<any[]>(`${API_URL}/batches`).pipe(
      tap(batches => {
        this.batches.set(batches.map(b => ({
          batchId: b.batchId,
          batchCode: b.batchCode,
          courseName: b.courseName || ''
        })));
      }),
      catchError(error => {
        console.error('Error loading batches:', error);
        return of([]);
      })
    );
  }

  getSessions(batchId?: number, start?: string, end?: string): Observable<CourseSession[]> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (batchId) params = params.set('batchId', batchId.toString());
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);

    return this.http.get<CourseSession[]>(`${API_URL}/coursesessions`, { params }).pipe(
      tap(data => {
        this.sessions.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading sessions:', error);
        this.toast.error('Failed to load schedule.');
        return throwError(() => error);
      })
    );
  }

  getSession(id: number): Observable<CourseSession> {
    return this.http.get<CourseSession>(`${API_URL}/coursesessions/${id}`);
  }

  createSession(dto: CreateSessionDto): Observable<CourseSession> {
    return this.http.post<CourseSession>(`${API_URL}/coursesessions`, dto).pipe(
      tap(created => {
        this.sessions.update(se => [...se, created]);
        this.toast.success('Session created successfully');
      }),
      catchError(error => {
        console.error('Error creating session:', error);
        this.toast.error('Failed to create session');
        return throwError(() => error);
      })
    );
  }

  updateSession(id: number, dto: UpdateSessionDto): Observable<CourseSession> {
    return this.http.put<CourseSession>(`${API_URL}/coursesessions/${id}`, dto).pipe(
      tap(updated => {
        this.sessions.update(se => se.map(s => s.appointmentId === id ? updated : s));
        this.toast.success('Session updated successfully');
      }),
      catchError(error => {
        console.error('Error updating session:', error);
        this.toast.error('Failed to update session');
        return throwError(() => error);
      })
    );
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/coursesessions/${id}`).pipe(
      tap(() => {
        this.sessions.update(se => se.filter(s => s.appointmentId !== id));
        this.toast.success('Session deleted successfully');
      }),
      catchError(error => {
        console.error('Error deleting session:', error);
        this.toast.error('Failed to delete session');
        return throwError(() => error);
      })
    );
  }

  checkConflicts(request: ConflictCheckRequest): Observable<ConflictCheckResult> {
    return this.http.post<ConflictCheckResult>(`${API_URL}/coursesessions/check-conflicts`, request);
  }

  generateTimetable(request: GenerateTimetableRequest): Observable<CourseSession[]> {
    this.isLoading.set(true);
    return this.http.post<CourseSession[]>(`${API_URL}/coursesessions/generate-timetable`, request).pipe(
      tap(created => {
        this.sessions.update(se => [...se, ...created]);
        this.isLoading.set(false);
        this.toast.success(`Generated ${created.length} sessions successfully`);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error generating timetable:', error);
        this.toast.error('Failed to generate timetable');
        return throwError(() => error);
      })
    );
  }

  publishSession(id: number): Observable<any> {
    return this.http.put(`${API_URL}/coursesessions/publish/${id}`, {});
  }
}
