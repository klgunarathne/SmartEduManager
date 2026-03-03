import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip adding Authorization header for OPTIONS (preflight) requests
  if (token && req.method !== 'OPTIONS') {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(clonedRequest).pipe(
      catchError(error => {
        // If token is expired, try to refresh it
        if (error.status === 401 && !req.url.includes('refresh-token')) {
          return authService.refreshToken().pipe(
            switchMap(response => {
              // Retry original request with new token
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`,
                },
              });
              return next(retryRequest);
            }),
            catchError(refreshError => {
              // If refresh fails, logout user
              authService.logout();
              return throwError(refreshError);
            })
          );
        }
        return throwError(error);
      })
    );
  }

  return next(req);
};