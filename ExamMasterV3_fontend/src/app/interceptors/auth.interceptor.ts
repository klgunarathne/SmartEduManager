import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StudentAuthService } from '../services/student-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(StudentAuthService);
  const token = authService.getToken();
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};