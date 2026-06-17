import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StudentAuthService } from '../services/student-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(StudentAuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
