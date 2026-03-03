import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleService, UserRole } from '../services/role.service';

/**
 * Role-based guard for route protection
 * Usage in routes:
 * { 
 *   path: 'admin', 
 *   canActivate: [roleGuard], 
 *   data: { roles: ['Admin'] } 
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as UserRole[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    // No specific roles required, allow access
    return true;
  }

  // Check if user has any of the required roles
  if (roleService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // User doesn't have required role, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Admin-only guard
 */
export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (!roleService.isAdmin()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

/**
 * Instructor-only guard
 */
export const instructorGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (!roleService.isInstructor()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

/**
 * Admin or Instructor guard (for shared routes)
 */
export const adminOrInstructorGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (!roleService.isAdmin() && !roleService.isInstructor()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
