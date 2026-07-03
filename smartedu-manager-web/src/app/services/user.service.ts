import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  address?: string;
  dateOfBirth?: Date;
  imageUrl?: string;
  roles: string[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  centerId?: number;
  courseId?: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    this.isLoading.set(true);
    return this.http.get<User[]>(`${this.API_URL}/users`).pipe(
      tap(data => {
        this.users.set(data);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        console.error('Error loading users:', error);
        return throwError(() => error);
      })
    );
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.API_URL}/users/roles`).pipe(
      tap(data => {
        this.roles.set(data);
      }),
      catchError(error => {
        console.error('Error loading roles:', error);
        return throwError(() => error);
      })
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/users`, user).pipe(
      tap(newUser => {
        this.users.update(users => [...users, newUser]);
      }),
      catchError(error => {
        console.error('Error creating user:', error);
        return throwError(() => error);
      })
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/users/${id}`, user).pipe(
      tap(updatedUser => {
        this.users.update(users => 
          users.map(u => u.id === id ? updatedUser : u)
        );
      }),
      catchError(error => {
        console.error('Error updating user:', error);
        return throwError(() => error);
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${id}`).pipe(
      tap(() => {
        this.users.update(users => users.filter(u => u.id !== id));
      }),
      catchError(error => {
        console.error('Error deleting user:', error);
        return throwError(() => error);
      })
    );
  }

  refreshUsers(): void {
    this.getUsers().subscribe();
  }
}
