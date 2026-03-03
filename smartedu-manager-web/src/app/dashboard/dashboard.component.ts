import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

/**
 * Interface for menu item configuration
 * Provides type-safe menu item definitions with support for
 * dividers, logout actions, disabled states, and routing
 */
interface MenuItem {
  label?: string;
  icon?: string;
  action?: () => void;
  route?: string;
  isDivider?: boolean;
  isLogout?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatCardModule,
    MatGridListModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  userFirstName = this.authService.userFirstName;
  userRole = this.authService.userRole;
  sidebarCollapsed = false;
  
  /**
   * Loading state for logout operation
   * Prevents multiple logout attempts and provides UI feedback
   */
  isLoggingOut = false;
  
  /**
   * Fallback avatar URL when user avatar fails to load
   */
  readonly defaultAvatarUrl = 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff';
  
  /**
   * Computed avatar URL based on user's first name
   * Uses UI Avatars API for dynamic avatar generation
   */
  get userAvatarUrl(): string {
    const firstName = this.userFirstName() || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=667eea&color=fff`;
  }
  
  /**
   * Menu items configuration array
   * Centralized menu definition for easy maintenance and extensibility
   * Supports: labels, icons, actions, routes, dividers, and disabled states
   */
  readonly menuItems: MenuItem[] = [
    {
      label: 'My Profile',
      icon: 'fas fa-user',
      route: '/profile',
      ariaLabel: 'View my profile'
    },
    {
      label: 'Settings',
      icon: 'fas fa-cog',
      route: '/settings',
      ariaLabel: 'Open settings'
    },
    {
      label: 'Help Center',
      icon: 'fas fa-question-circle',
      route: '/help',
      ariaLabel: 'Get help'
    },
    { isDivider: true },
    {
      label: 'Sign Out',
      icon: 'fas fa-sign-out-alt',
      action: () => this.logout(),
      isLogout: true,
      ariaLabel: 'Sign out of your account'
    }
  ];

  constructor(private routerOld: Router) {}

  /**
   * Handles menu item click events
   * Routes to specified route or executes custom action
   * @param item - The menu item that was clicked
   */
  handleMenuItemClick(item: MenuItem): void {
    // Prevent action if item is disabled or during logout
    if (item.disabled || this.isLoggingOut) {
      return;
    }
    
    // Execute custom action if defined, otherwise navigate
    if (item.action) {
      item.action();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  /**
   * Logs out the current user
   * Sets loading state, calls auth service, and navigates to login
   * Includes error handling for failed logout attempts
   */
  async logout(): Promise<void> {
    // Prevent multiple simultaneous logout attempts
    if (this.isLoggingOut) {
      return;
    }
    
    this.isLoggingOut = true;
    
    try {
      this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
      // Reset loading state on error so user can retry
      this.isLoggingOut = false;
      
      // Optional: Show error notification to user
      // this.snackBar.open('Logout failed. Please try again.', 'Close', { duration: 3000 });
    }
  }

  /**
   * Handles avatar image load errors
   * Provides fallback to default avatar on image failure
   * @param event - The error event from the image element
   */
  onAvatarError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultAvatarUrl;
    // Prevent recursive error handling
    imgElement.onerror = null;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleSubmenu(event: Event, submenuId: string): void {
    event.preventDefault();
    const submenu = document.getElementById(submenuId);
    if (submenu) {
      submenu.classList.toggle('active');
    }
  }
}