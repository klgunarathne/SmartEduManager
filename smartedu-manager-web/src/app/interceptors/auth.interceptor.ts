import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh-token')) {
    return next(req);
  }

  const token = authService.accessToken();
  if (!token || authService.isTokenExpiredPublic(token)) {
    const refreshToken = authService.refreshToken();
    if (refreshToken) {
      return authService.refreshAccessToken().pipe(
        switchMap(() => {
          const refreshedToken = authService.accessToken();
          if (!refreshedToken) {
            authService.clearAuthPublic();
            router.navigate(['/login']);
            return throwError(() => new Error('Authentication required'));
          }
          return next(addAuthorization(req, refreshedToken));
        }),
        catchError(() => {
          authService.clearAuthPublic();
          router.navigate(['/login']);
          return throwError(() => new Error('Authentication required'));
        })
      );
    }

    authService.clearAuthPublic();
    router.navigate(['/login']);
    return throwError(() => new Error('Authentication required'));
  }

  const authReq = addAuthorization(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap(() => {
          const refreshedToken = authService.accessToken();
          if (!refreshedToken) {
            return throwError(() => error);
          }

          return next(addAuthorization(req, refreshedToken));
        }),
        catchError(refreshError => {
          authService.clearAuthPublic();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function addAuthorization(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
