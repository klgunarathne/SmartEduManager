import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  isSidebarCollapsed = false;
  isProfileMenuOpen = false;

  userFullName = this.authService.userFullName;
  userRole = this.authService.userRole;
  userFirstName = this.authService.userFirstName;

  constructor(private authService: AuthService) {}

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout() {
    this.authService.logout();
  }

  getUserAvatar() {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userFirstName())}&background=random`;
  }
}
