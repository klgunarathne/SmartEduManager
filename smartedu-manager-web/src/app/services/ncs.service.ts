import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NCS {
  id: number;
  version: string;
  name: string;
  updatedDate: string;
  courseId: number;
  courseName: string;
  modules: Module[];
}

export interface Module {
  id: number;
  moduleNo: string;
  moduleName: string;
  theoryHours: number;
  practicalHours: number;
  ncsId: number;
  tasks: any[];
}

export interface CreateNCS {
  version: string;
  name: string;
  updatedDate: string;
  courseId: number;
}

@Injectable({
  providedIn: 'root'
})
export class NcsService {
  private readonly API_URL = environment.apiUrl;

  ncsList = signal<NCS[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getNCS(): Observable<NCS[]> {
    this.isLoading.set(true);
    return this.http.get<NCS[]>(`${this.API_URL}/ncs`).pipe(
      tap(data => {
        this.ncsList.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading NCS:', error);
        return throwError(() => error);
      })
    );
  }

  getNCSByCourse(courseId: number): Observable<NCS[]> {
    return this.http.get<NCS[]>(`${this.API_URL}/ncs/course/${courseId}`);
  }

  getNCSById(id: number): Observable<NCS> {
    return this.http.get<NCS>(`${this.API_URL}/ncs/${id}`);
  }

  createNCS(ncs: CreateNCS): Observable<NCS> {
    return this.http.post<NCS>(`${this.API_URL}/ncs`, ncs).pipe(
      tap(newNcs => {
        this.ncsList.update(list => [...list, newNcs]);
      }),
      catchError(error => {
        console.error('Error creating NCS:', error);
        return throwError(() => error);
      })
    );
  }

  updateNCS(id: number, ncs: Partial<CreateNCS>): Observable<any> {
    return this.http.put(`${this.API_URL}/ncs/${id}`, ncs).pipe(
      tap(() => {
        this.ncsList.update(list => 
          list.map(n => n.id === id ? { ...n, ...ncs } : n)
        );
      }),
      catchError(error => {
        console.error('Error updating NCS:', error);
        return throwError(() => error);
      })
    );
  }

  deleteNCS(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/ncs/${id}`).pipe(
      tap(() => {
        this.ncsList.update(list => list.filter(n => n.id !== id));
      }),
      catchError(error => {
        console.error('Error deleting NCS:', error);
        return throwError(() => error);
      })
    );
  }
}
