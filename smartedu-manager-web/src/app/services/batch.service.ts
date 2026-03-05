import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Batch {
  batchId: number;
  batchCode: string;
  courseId: number;
  courseName: string;
  startDate: string;
  endDate: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private readonly API_URL = environment.apiUrl;

  batches = signal<Batch[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getBatches(): Observable<Batch[]> {
    this.isLoading.set(true);
    return this.http.get<Batch[]>(`${this.API_URL}/batches`).pipe(
      tap(data => {
        this.batches.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading batches:', error);
        return throwError(() => error);
      })
    );
  }

  getBatch(id: number): Observable<Batch> {
    return this.http.get<Batch>(`${this.API_URL}/batches/${id}`);
  }

  getActiveBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.API_URL}/batches/active`);
  }
}
