import { Injectable, signal, effect } from '@angular/core';
import { AuthService } from './auth.service';

export type UserRole = 'Admin' | 'Instructor' | '';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly _currentRole = signal<UserRole>('');

  constructor(private authService: AuthService) {
    // Initialize role from auth service
    this._currentRole.set(authService.userRole() as UserRole);
    
    // Use effect to track role changes from auth service
    effect(() => {
      const role = authService.userRole();
      this._currentRole.set(role as UserRole);
    });
  }

  /**
   * Get current user role
   */
  get currentRole(): UserRole {
    return this._currentRole();
  }

  /**
   * Check if current user is Admin
   */
  isAdmin(): boolean {
    return this._currentRole() === 'Admin';
  }

  /**
   * Check if current user is Instructor
   */
  isInstructor(): boolean {
    return this._currentRole() === 'Instructor';
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this._currentRole() === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this._currentRole());
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isLoggedIn();
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role?: UserRole): string {
    const currentRole = role || this._currentRole();
    switch (currentRole) {
      case 'Admin':
        return 'Administrator';
      case 'Instructor':
        return 'Instructor';
      default:
        return 'User';
    }
  }

  /**
   * Refresh role from auth service
   */
  refreshRole(): void {
    const role = this.authService.userRole();
    this._currentRole.set(role as UserRole);
  }
}
