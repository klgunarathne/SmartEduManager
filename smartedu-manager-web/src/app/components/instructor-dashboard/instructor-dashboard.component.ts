import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserDto } from '../../services/auth.service';
import { InstructorService, Instructor } from '../../services/instructor.service';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      @if (instructorData) {
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
      }
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }
    .instructor-welcome { background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20px; padding: 30px; color: white; display: flex; justify-content: space-between; align-items: center; }
    .welcome-left { display: flex; align-items: center; gap: 20px; }
    .profile-avatar-lg { width: 70px; height: 70px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; }
    .welcome-text h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .welcome-text p { opacity: 0.8; font-size: 14px; }
    .profile-quick-info { display: flex; gap: 24px; }
    .info-item { display: flex; align-items: center; gap: 8px; opacity: 0.9; }
    .info-item i { color: #818cf8; }

    .instructor-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
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

    @media (max-width: 1200px) { .instructor-stats, .instructor-actions { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .instructor-welcome { flex-direction: column; text-align: center; gap: 20px; } .instructor-stats, .instructor-actions { grid-template-columns: 1fr; } .profile-quick-info { flex-direction: column; gap: 12px; } }
  `]
})
export class InstructorDashboardComponent implements OnInit {
  currentUser: UserDto | null = null;
  instructorData: Instructor | null = null;

  instructorStats = signal({
    totalStudents: 0,
    totalBatches: 0,
    activeBatch: 'N/A',
    activeStudents: 0
  });

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadInstructorData();
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
