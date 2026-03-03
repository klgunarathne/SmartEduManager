import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Batch, CreateBatchDto, UpdateBatchDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private readonly baseUrl = 'https://localhost:7160/api/batches';

  constructor(private http: HttpClient) {}

  /**
   * Get all batches
   */
  getBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(this.baseUrl);
  }

  /**
   * Get batch by ID
   */
  getBatch(id: number): Observable<Batch> {
    return this.http.get<Batch>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new batch
   */
  createBatch(batch: CreateBatchDto): Observable<Batch> {
    return this.http.post<Batch>(this.baseUrl, batch);
  }

  /**
   * Update an existing batch
   */
  updateBatch(id: number, batch: UpdateBatchDto): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/${id}`, batch);
  }

  /**
   * Delete a batch
   */
  deleteBatch(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get batches by course ID (for instructors)
   */
  getBatchesByCourse(courseId: number): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.baseUrl}?courseId=${courseId}`);
  }
}
