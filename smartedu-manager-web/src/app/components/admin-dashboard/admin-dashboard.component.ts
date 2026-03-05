import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserDto } from '../../services/auth.service';
import { InstructorService, Instructor } from '../../services/instructor.service';
import { FormsModule } from '@angular/forms';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  color: string;
}

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard">
      @if (isInstructor && instructorData) {
        <!-- Instructor Dashboard -->
        <div class="instructor-welcome">
          <div class="welcome-left">
            <div class="profile-avatar-lg" [style.background]="getAvatarColor(instructorData.fullName)">
              {{ getInitials(instructorData.fullName) }}
            </div>
            <div class="welcome-text">
              <h2>Welcome, {{ instructorData.fullName }}!</h2>
              <p>Manage your batches, students, and curriculum</p>
            </div>
          </div>
          <div class="profile-quick-info">
            <div class="info-item">
              <i class="fas fa-id-card"></i>
              <span>{{ instructorData.epfNo }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-envelope"></i>
              <span>{{ instructorData.email }}</span>
            </div>
          </div>
        </div>
        
        <div class="instructor-stats">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="stat-content">
              <span class="stat-title">Total Students</span>
              <span class="stat-value">{{ instructorStats().totalStudents }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <span class="stat-title">No of Batches</span>
              <span class="stat-value">{{ instructorStats().totalBatches }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="stat-content">
              <span class="stat-title">Active Batch</span>
              <span class="stat-value">{{ instructorStats().activeBatch }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #ec4899, #f472b6)">
              <i class="fas fa-user-clock"></i>
            </div>
            <div class="stat-content">
              <span class="stat-title">Active Batch Students</span>
              <span class="stat-value">{{ instructorStats().activeStudents }}</span>
            </div>
          </div>
        </div>

        <div class="instructor-actions">
          <div class="action-card" routerLink="/admin/instructors">
            <div class="action-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
              <i class="fas fa-book"></i>
            </div>
            <div class="action-content">
              <h3>NCS & Modules</h3>
              <p>Manage Curriculum</p>
            </div>
            <i class="fas fa-chevron-right arrow"></i>
          </div>
          <div class="action-card" routerLink="/instructor/batches">
            <div class="action-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
              <i class="fas fa-users"></i>
            </div>
            <div class="action-content">
              <h3>Batches</h3>
              <p>Manage Batches</p>
            </div>
            <i class="fas fa-chevron-right arrow"></i>
          </div>
          <div class="action-card" routerLink="/instructor/students">
            <div class="action-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="action-content">
              <h3>Students</h3>
              <p>View Students</p>
            </div>
            <i class="fas fa-chevron-right arrow"></i>
          </div>
          <div class="action-card" routerLink="/instructor/assignments">
            <div class="action-icon" style="background: linear-gradient(135deg, #ec4899, #f472b6)">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="action-content">
              <h3>Assignments</h3>
              <p>Manage Assignments</p>
            </div>
            <i class="fas fa-chevron-right arrow"></i>
          </div>
        </div>
      } @else {
        <!-- Admin Dashboard -->
        <div class="welcome-section">
          <div class="welcome-content">
            <h2>Welcome back! 👋</h2>
            <p>Here's what's happening with your education center today.</p>
          </div>
          <div class="welcome-actions">
            <button class="btn btn-primary">
              <i class="fas fa-plus"></i>
              Add New Student
            </button>
          </div>
        </div>

        <div class="stats-grid">
          @for (stat of stats(); track stat.title) {
            <div class="stat-card">
              <div class="stat-icon" [style.background]="stat.color">
                <i [class]="stat.icon"></i>
              </div>
              <div class="stat-content">
                <span class="stat-title">{{ stat.title }}</span>
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-change" [class.positive]="stat.changeType === 'positive'" [class.negative]="stat.changeType === 'negative'">
                  <i class="fas" [class.fa-arrow-up]="stat.changeType === 'positive'" [class.fa-arrow-down]="stat.changeType === 'negative'" [class.fa-minus]="stat.changeType === 'neutral'"></i>
                  {{ stat.change }}
                </span>
              </div>
            </div>
          }
        </div>

        <div class="content-grid">
          <div class="card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="card-body">
              <div class="quick-actions-grid">
                @for (action of quickActions; track action.title) {
                  <a [routerLink]="action.route" class="quick-action">
                    <div class="quick-action-icon" [style.background]="action.color">
                      <i [class]="action.icon"></i>
                    </div>
                    <span>{{ action.title }}</span>
                  </a>
                }
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div class="card-body">
              <div class="activity-list">
                @for (activity of recentActivities; track activity.id) {
                  <div class="activity-item">
                    <div class="activity-icon" [style.background]="activity.color">
                      <i [class]="activity.icon"></i>
                    </div>
                    <div class="activity-content">
                      <span class="activity-user">{{ activity.user }}</span>
                      <span class="activity-action">{{ activity.action }}</span>
                    </div>
                    <span class="activity-time">{{ activity.time }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }
    .instructor-welcome, .welcome-section { background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20px; padding: 30px; color: white; display: flex; justify-content: space-between; align-items: center; }
    .welcome-left { display: flex; align-items: center; gap: 20px; }
    .profile-avatar-lg { width: 70px; height: 70px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; }
    .welcome-text h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .welcome-text p { opacity: 0.8; font-size: 14px; }
    .profile-quick-info { display: flex; gap: 24px; }
    .info-item { display: flex; align-items: center; gap: 8px; opacity: 0.9; }
    .info-item i { color: #818cf8; }

    .instructor-stats, .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .stat-card { background: white; border-radius: 16px; padding: 24px; display: flex; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .stat-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon i { font-size: 24px; color: white; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-title { font-size: 14px; color: #64748b; font-weight: 500; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1e293b; margin: 4px 0; }

    .instructor-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .action-card { background: white; border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: all 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-decoration: none; }
    .action-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .action-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .action-icon i { font-size: 20px; color: white; }
    .action-content h3 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    .action-content p { font-size: 13px; color: #64748b; }
    .arrow { margin-left: auto; color: #cbd5e1; }

    .welcome-section { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .welcome-content h2 { font-size: 28px; }
    .welcome-actions { position: relative; z-index: 1; }
    .btn { padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px; border: none; }
    .btn-primary { background: white; color: #6366f1; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }

    .content-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; }
    .card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
    .card-body { padding: 24px; }

    .quick-actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .quick-action { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; background: #f8fafc; border-radius: 14px; text-decoration: none; transition: all 0.3s; }
    .quick-action:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
    .quick-action-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .quick-action-icon i { font-size: 20px; color: white; }
    .quick-action span { font-size: 14px; font-weight: 600; color: #475569; }

    .activity-list { display: flex; flex-direction: column; gap: 16px; }
    .activity-item { display: flex; align-items: center; gap: 14px; padding: 12px; background: #f8fafc; border-radius: 12px; }
    .activity-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .activity-icon i { font-size: 16px; color: white; }
    .activity-content { flex: 1; display: flex; flex-direction: column; }
    .activity-user { font-size: 14px; font-weight: 600; color: #1e293b; }
    .activity-action { font-size: 13px; color: #64748b; }
    .activity-time { font-size: 12px; color: #94a3b8; white-space: nowrap; }

    @media (max-width: 1200px) { .content-grid { grid-template-columns: 1fr; } .instructor-stats, .stats-grid, .instructor-actions { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .instructor-welcome, .welcome-section { flex-direction: column; text-align: center; gap: 20px; } .stats-grid, .instructor-stats, .instructor-actions { grid-template-columns: 1fr; } .profile-quick-info { flex-direction: column; gap: 12px; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  currentUser: UserDto | null = null;
  instructorData: Instructor | null = null;

  instructorStats = signal({
    totalStudents: 0,
    totalBatches: 0,
    activeBatch: 'N/A',
    activeStudents: 0
  });

  stats = signal<StatCard[]>([
    { title: 'Total Students', value: '1,245', icon: 'fas fa-user-graduate', change: '+12% from last month', changeType: 'positive', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { title: 'Total Instructors', value: '48', icon: 'fas fa-chalkboard-teacher', change: '+5% from last month', changeType: 'positive', color: 'linear-gradient(135deg, #10b981, #34d399)' },
    { title: 'Active Courses', value: '24', icon: 'fas fa-book-open', change: '+2 new this week', changeType: 'positive', color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { title: 'Total Centers', value: '12', icon: 'fas fa-building', change: 'No change', changeType: 'neutral', color: 'linear-gradient(135deg, #ec4899, #f472b6)' }
  ]);

  quickActions: QuickAction[] = [
    { title: 'Add Student', icon: 'fas fa-user-plus', route: '/admin/students/add', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { title: 'Add Course', icon: 'fas fa-book-medical', route: '/admin/courses/add', color: 'linear-gradient(135deg, #10b981, #34d399)' },
    { title: 'Create Batch', icon: 'fas fa-users-rectangle', route: '/admin/batches/add', color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { title: 'Add Instructor', icon: 'fas fa-user-tie', route: '/admin/instructors/add', color: 'linear-gradient(135deg, #ec4899, #f472b6)' }
  ];

  recentActivities = [
    { id: 1, user: 'John Doe', action: 'registered for Web Development course', time: '5 min ago', icon: 'fas fa-user-plus', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { id: 2, user: 'Sarah Smith', action: 'completed Assignment #24', time: '15 min ago', icon: 'fas fa-check-circle', color: 'linear-gradient(135deg, #10b981, #34d399)' },
    { id: 3, user: 'Mike Johnson', action: 'submitted assignment for review', time: '1 hour ago', icon: 'fas fa-file-upload', color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { id: 4, user: 'Emily Brown', action: 'enrolled in Data Science batch', time: '2 hours ago', icon: 'fas fa-graduation-cap', color: 'linear-gradient(135deg, #ec4899, #f472b6)' }
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (this.authService.isInstructor()) {
      this.loadInstructorData();
    }
  }

  private loadInstructorData(): void {
    this.instructorService.getInstructors().subscribe({
      next: (instructors) => {
        const userEmail = this.currentUser?.email?.toLowerCase();
        this.instructorData = instructors.find(i => i.email?.toLowerCase() === userEmail) || null;
        if (this.instructorData) {
          this.instructorStats.set({
            totalStudents: 45,
            totalBatches: 3,
            activeBatch: 'WD-2026-A',
            activeStudents: 18
          });
        }
      }
    });
  }

  get isInstructor(): boolean {
    return this.authService.isInstructor();
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #f59e0b, #fbbf24)',
      'linear-gradient(135deg, #ec4899, #f472b6)',
      'linear-gradient(135deg, #3b82f6, #60a5fa)'
    ];
    const index = name?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }

  constructor(
    private authService: AuthService,
    private instructorService: InstructorService
  ) {}
}
