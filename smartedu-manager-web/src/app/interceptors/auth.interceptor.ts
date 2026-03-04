import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError, tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');
  
  // Skip adding token for login request
  if (req.url.includes('/auth/login')) {
    return next(req);
  }
  
  // Validate token exists
  if (!token) {
    router.navigate(['/login']);
    return next(req);
  }
  
  // Validate JWT format (should have 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.error('Invalid JWT format, redirecting to login');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.navigate(['/login']);
    return throwError(() => new Error('Invalid token'));
  }
  
  // Clone request with authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid - clear auth and redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
