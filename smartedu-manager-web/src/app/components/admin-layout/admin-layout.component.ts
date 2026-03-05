import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <i class="fas fa-graduation-cap"></i>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">SmartEdu</span>
            }
          </div>
          <button class="toggle-btn" (click)="toggleSidebar()">
            <i class="fas" [class.fa-bars]="sidebarCollapsed()" [class.fa-times]="!sidebarCollapsed()"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          @if (isAdmin()) {
            <ul class="nav-list">
              <li class="nav-item">
                <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-chart-line"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Dashboard</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/admin/centers" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-building"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Centers</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/admin/courses" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-book"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Courses</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/admin/instructors" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-chalkboard-teacher"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Instructors</span>
                  }
                </a>
              </li>
            </ul>

            @if (!sidebarCollapsed()) {
              <div class="nav-section-title">Settings</div>
            }
            <ul class="nav-list">
              <li class="nav-item">
                <a routerLink="/admin/users" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-user-cog"></i>
                  @if (!sidebarCollapsed()) {
                    <span>User Manager</span>
                  }
                </a>
              </li>
            </ul>
          }

          @if (isInstructor()) {
            <ul class="nav-list">
              <li class="nav-item">
                <a routerLink="/instructor/dashboard" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-chart-line"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Dashboard</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/instructor/ncs" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-layer-group"></i>
                  @if (!sidebarCollapsed()) {
                    <span>NCS & Modules</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/instructor/batches" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-users"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Batches</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/instructor/students" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-user-graduate"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Students</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/instructor/assignments" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-tasks"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Assignments</span>
                  }
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/instructor/continuous-assessments" routerLinkActive="active" class="nav-link">
                  <i class="fas fa-clipboard-list"></i>
                  @if (!sidebarCollapsed()) {
                    <span>Continuous Assessments</span>
                  }
                </a>
              </li>
            </ul>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" [class.compact]="sidebarCollapsed()">
            <div class="user-avatar">
              <i class="fas fa-user"></i>
            </div>
            @if (!sidebarCollapsed()) {
              <div class="user-details">
                <span class="user-name">{{ userName }}</span>
                <span class="user-role">{{ userRole }}</span>
              </div>
            }
          </div>
          <button class="logout-btn" (click)="logout()" [title]="sidebarCollapsed() ? 'Logout' : ''">
            <i class="fas fa-sign-out-alt"></i>
            @if (!sidebarCollapsed()) {
              <span>Logout</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="top-header">
          <div class="header-left">
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="header-right">
            <div class="header-actions">
              <button class="header-btn">
                <i class="fas fa-bell"></i>
                <span class="notification-badge">3</span>
              </button>
              <button class="header-btn">
                <i class="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </header>

        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #f3f4f6;
    }

    /* Sidebar */
    .sidebar {
      width: 270px;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 1000;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    }

    .sidebar-collapsed .sidebar {
      width: 80px;
    }

    .sidebar-header {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo i {
      font-size: 28px;
      color: #818cf8;
    }

    .logo-text {
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #818cf8, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .toggle-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 12px;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      padding: 20px 16px 10px;
    }

    .nav-item {
      margin-bottom: 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 12px;
      transition: all 0.3s ease;
      font-size: 15px;
      font-weight: 500;
    }

    .nav-link i {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-link.active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }

    .sidebar-collapsed .nav-link {
      justify-content: center;
      padding: 14px;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .user-info.compact {
      justify-content: center;
      padding: 10px;
    }

    .user-avatar {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-avatar i {
      font-size: 18px;
      color: white;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 12px;
      color: #94a3b8;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
    }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 270px;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .sidebar-collapsed .main-content {
      margin-left: 80px;
    }

    .top-header {
      background: white;
      padding: 20px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .header-btn {
      width: 42px;
      height: 42px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      font-size: 16px;
      transition: all 0.3s;
      position: relative;
    }

    .header-btn:hover {
      background: #f1f5f9;
      color: #6366f1;
      border-color: #6366f1;
    }

    .notification-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      width: 20px;
      height: 20px;
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: 600;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-wrapper {
      flex: 1;
      padding: 30px;
    }

    @media (max-width: 1024px) {
      .sidebar {
        width: 80px;
      }

      .main-content {
        margin-left: 80px;
      }

      .logo-text,
      .nav-link span,
      .user-details,
      .logout-btn span {
        display: none;
      }

      .nav-link {
        justify-content: center;
        padding: 14px;
      }

      .user-info {
        justify-content: center;
        padding: 10px;
      }

      .logout-btn {
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class AdminLayoutComponent {
  sidebarCollapsed = signal(false);
  pageTitle = 'Dashboard';

  get userName(): string {
    const user = this.authService.getUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Admin';
  }

  get userRole(): string {
    if (this.authService.isAdmin()) return 'Administrator';
    if (this.authService.isInstructor()) return 'Instructor';
    if (this.authService.isStudent()) return 'Student';
    return 'User';
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isInstructor(): boolean {
    return this.authService.isInstructor();
  }

  isStudent(): boolean {
    return this.authService.isStudent();
  }

  constructor(private authService: AuthService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  logout(): void {
    this.authService.logout();
  }
}
