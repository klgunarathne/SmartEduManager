import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Center {
  centerId: number;
  centerName: string;
  districtId: number;
  districtName: string;
  address: string;
  contactNumber: string;
}

export interface CreateCenter {
  centerName: string;
  districtId: number;
  address: string;
  contactNumber: string;
}

export interface District {
  districtId: number;
  districtName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CenterService {
  private readonly API_URL = environment.apiUrl;

  centers = signal<Center[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getCenters(): Observable<Center[]> {
    this.isLoading.set(true);
    return this.http.get<Center[]>(`${this.API_URL}/centers`).pipe(
      tap(data => {
        this.centers.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading centers:', error);
        return throwError(() => error);
      })
    );
  }

  getCenter(id: number): Observable<Center> {
    return this.http.get<Center>(`${this.API_URL}/centers/${id}`);
  }

  createCenter(center: CreateCenter): Observable<Center> {
    return this.http.post<Center>(`${this.API_URL}/centers`, center).pipe(
      tap(newCenter => {
        this.centers.update(centers => [...centers, newCenter]);
      }),
      catchError(error => {
        console.error('Error creating center:', error);
        return throwError(() => error);
      })
    );
  }

  updateCenter(id: number, center: Partial<CreateCenter>): Observable<any> {
    return this.http.put(`${this.API_URL}/centers/${id}`, center).pipe(
      tap(() => {
        this.centers.update(centers => 
          centers.map(c => c.centerId === id ? { ...c, ...center } : c)
        );
      }),
      catchError(error => {
        console.error('Error updating center:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCenter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/centers/${id}`).pipe(
      tap(() => {
        this.centers.update(centers => centers.filter(c => c.centerId !== id));
      }),
      catchError(error => {
        console.error('Error deleting center:', error);
        return throwError(() => error);
      })
    );
  }

  getDistricts(): Observable<District[]> {
    return this.http.get<District[]>(`${this.API_URL}/districts`).pipe(
      catchError(error => {
        console.error('Error loading districts:', error);
        return throwError(() => error);
      })
    );
  }
}
