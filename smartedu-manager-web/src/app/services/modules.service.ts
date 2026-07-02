import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Module {
  id: number;
  moduleNo: string;
  moduleName: string;
  theoryHours: number;
  practicalHours: number;
  ncsId: number;
  tasks: ModuleTask[];
}

export interface ModuleTask {
  id: number;
  taskNo: string;
  taskName: string;
  moduleId: number;
}

export interface CreateModule {
  moduleNo: string;
  moduleName: string;
  theoryHours: number;
  practicalHours: number;
  ncsId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ModulesService {
  private readonly API_URL = environment.apiUrl;

  modules = signal<Module[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getModules(): Observable<Module[]> {
    this.isLoading.set(true);
    return this.http.get<Module[]>(`${this.API_URL}/modules`).pipe(
      tap(data => {
        this.modules.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading modules:', error);
        return throwError(() => error);
      })
    );
  }

  getModulesByNCS(ncsId: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.API_URL}/modules/ncs/${ncsId}`);
  }

  getModule(id: number): Observable<Module> {
    return this.http.get<Module>(`${this.API_URL}/modules/${id}`);
  }

  getAllTasks(): Observable<ModuleTask[]> {
    return this.http.get<ModuleTask[]>(`${this.API_URL}/modules/tasks`);
  }

  createModule(module: CreateModule): Observable<Module> {
    return this.http.post<Module>(`${this.API_URL}/modules`, module).pipe(
      tap(newModule => {
        this.modules.update(list => [...list, newModule]);
      }),
      catchError(error => {
        console.error('Error creating module:', error);
        return throwError(() => error);
      })
    );
  }

  updateModule(id: number, module: Partial<CreateModule>): Observable<any> {
    return this.http.put(`${this.API_URL}/modules/${id}`, module).pipe(
      tap(() => {
        this.modules.update(list => 
          list.map(m => m.id === id ? { ...m, ...module } : m)
        );
      }),
      catchError(error => {
        console.error('Error updating module:', error);
        return throwError(() => error);
      })
    );
  }

  deleteModule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/modules/${id}`).pipe(
      tap(() => {
        this.modules.update(list => list.filter(m => m.id !== id));
      }),
      catchError(error => {
        console.error('Error deleting module:', error);
        return throwError(() => error);
      })
    );
  }
}
