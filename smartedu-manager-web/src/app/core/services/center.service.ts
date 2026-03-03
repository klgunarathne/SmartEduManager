import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Center, CreateCenterDto, UpdateCenterDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CenterService {
  private readonly baseUrl = 'https://localhost:7160/api/centers';

  constructor(private http: HttpClient) {}

  /**
   * Get all centers
   */
  getCenters(): Observable<Center[]> {
    return this.http.get<Center[]>(this.baseUrl);
  }

  /**
   * Get center by ID
   */
  getCenter(id: number): Observable<Center> {
    return this.http.get<Center>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new center
   */
  createCenter(center: CreateCenterDto): Observable<Center> {
    return this.http.post<Center>(this.baseUrl, center);
  }

  /**
   * Update an existing center
   */
  updateCenter(id: number, center: UpdateCenterDto): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/${id}`, center);
  }

  /**
   * Delete a center
   */
  deleteCenter(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`);
  }
}
