import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-instructor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './instructor.component.html',
  styleUrls: ['./instructor.component.scss']
})
export class InstructorComponent {
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
