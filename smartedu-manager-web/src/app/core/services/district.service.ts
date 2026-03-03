import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { District } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DistrictService {
  private readonly baseUrl = 'https://localhost:7160/api/districts';

  constructor(private http: HttpClient) {}

  /**
   * Get all districts
   */
  getDistricts(): Observable<District[]> {
    return this.http.get<District[]>(this.baseUrl);
  }

  /**
   * Get district by ID
   */
  getDistrict(id: number): Observable<District> {
    return this.http.get<District>(`${this.baseUrl}/${id}`);
  }
}
