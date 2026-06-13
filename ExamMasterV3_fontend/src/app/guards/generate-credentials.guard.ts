import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { StudentAuthService } from '../services/student-auth.service';

export const generateCredentialsGuard: CanActivateFn = (route, state) => {
  const authService = inject(StudentAuthService);
  const router = inject(Router);
  
  if (authService.getToken() && authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};