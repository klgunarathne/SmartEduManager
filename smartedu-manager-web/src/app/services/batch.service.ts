import { Injectable, signal, computed } from '@angular/core';
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

export interface CreateBatchDto {
  batchCode: string;
  courseId: number;
  startDate: string;
  endDate: string;
}

export interface UpdateBatchDto {
  batchCode?: string;
  courseId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private readonly API_URL = environment.apiUrl;

  batches = signal<Batch[]>([]);
  isLoading = signal(false);
  currentBatchId = signal<number>(0);

  constructor(private http: HttpClient) {}

  getBatches(): Observable<Batch[]> {
    this.isLoading.set(true);
    return this.http.get<Batch[]>(`${this.API_URL}/batches`).pipe(
      tap(data => {
        this.batches.set(data);
        this.currentBatchId.set(this.computeCurrentBatchId(data));
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading batches:', error);
        return throwError(() => error);
      })
    );
  }

  private computeCurrentBatchId(batches: Batch[]): number {
    if (!batches || batches.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBatches = batches.filter(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return today >= start && today <= end;
    });

    const pool = activeBatches.length > 0 ? activeBatches : batches;
    pool.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return pool[0]?.batchId ?? 0;
  }

  getBatch(id: number): Observable<Batch> {
    return this.http.get<Batch>(`${this.API_URL}/batches/${id}`);
  }

  getActiveBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.API_URL}/batches/active`);
  }

  createBatch(dto: CreateBatchDto): Observable<Batch> {
    return this.http.post<Batch>(`${this.API_URL}/batches`, dto).pipe(
      tap(created => {
        this.batches.update(list => [...list, created]);
      }),
      catchError(error => {
        console.error('Error creating batch:', error);
        return throwError(() => error);
      })
    );
  }

  updateBatch(id: number, dto: UpdateBatchDto): Observable<string> {
    return this.http.put(`${this.API_URL}/batches/${id}`, dto, { responseType: 'text' }).pipe(
      tap(() => {
        this.batches.update(list =>
          list.map(b => b.batchId === id ? { ...b, ...dto, batchId: b.batchId } : b)
        );
      }),
      catchError(error => {
        console.error('Error updating batch:', error);
        return throwError(() => error);
      })
    );
  }

  deleteBatch(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/batches/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.batches.update(list => list.filter(b => b.batchId !== id));
      }),
      catchError(error => {
        console.error('Error deleting batch:', error);
        return throwError(() => error);
      })
    );
  }
}
