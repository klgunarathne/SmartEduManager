import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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

interface RecentActivity {
  id: number;
  user: string;
  action: string;
  time: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Welcome Section -->
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

      <!-- Stats Grid -->
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

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Quick Actions -->
        <div class="card quick-actions-card">
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

        <!-- Recent Activity -->
        <div class="card activity-card">
          <div class="card-header">
            <h3>Recent Activity</h3>
            <a href="#" class="view-all">View All</a>
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

      <!-- Charts Section -->
      <div class="charts-grid">
        <div class="card chart-card">
          <div class="card-header">
            <h3>Student Enrollment Trend</h3>
          </div>
          <div class="card-body">
            <div class="chart-placeholder">
              <div class="chart-bars">
                @for (bar of enrollmentData; track bar.month) {
                  <div class="bar-container">
                    <div class="bar" [style.height.%]="bar.percentage" [style.background]="bar.color"></div>
                    <span class="bar-label">{{ bar.month }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header">
            <h3>Course Distribution</h3>
          </div>
          <div class="card-body">
            <div class="distribution-list">
              @for (course of courseDistribution; track course.name) {
                <div class="distribution-item">
                  <div class="distribution-info">
                    <span class="distribution-name">{{ course.name }}</span>
                    <span class="distribution-value">{{ course.students }} students</span>
                  </div>
                  <div class="distribution-bar">
                    <div class="bar-fill" [style.width.%]="course.percentage" [style.background]="course.color"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-section">
        <div class="card">
          <div class="card-header">
            <h3>Recent Registrations</h3>
            <div class="table-actions">
              <input type="text" placeholder="Search..." class="search-input">
              <button class="btn btn-outline">
                <i class="fas fa-filter"></i>
                Filter
              </button>
            </div>
          </div>
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Center</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (student of recentStudents; track student.id) {
                  <tr>
                    <td>
                      <div class="student-cell">
                        <div class="student-avatar" [style.background]="student.avatarColor">
                          {{ student.initials }}
                        </div>
                        <span>{{ student.name }}</span>
                      </div>
                    </td>
                    <td>{{ student.course }}</td>
                    <td>{{ student.batch }}</td>
                    <td>{{ student.center }}</td>
                    <td>
                      <span class="status-badge" [class]="student.status">
                        {{ student.status }}
                      </span>
                    </td>
                    <td>
                      <div class="table-actions-cell">
                        <button class="action-btn" title="View">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn" title="Edit">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn danger" title="Delete">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 25px;
    }

    /* Welcome Section */
    .welcome-section {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 20px;
      padding: 30px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .welcome-section::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .welcome-section::after {
      content: '';
      position: absolute;
      bottom: -30%;
      right: 20%;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
    }

    .welcome-content {
      position: relative;
      z-index: 1;
    }

    .welcome-content h2 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .welcome-content p {
      font-size: 16px;
      opacity: 0.9;
    }

    .welcome-actions {
      position: relative;
      z-index: 1;
    }

    .btn {
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
    }

    .btn-primary {
      background: white;
      color: #6366f1;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    .btn-outline:hover {
      border-color: #6366f1;
      color: #6366f1;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon i {
      font-size: 24px;
      color: white;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-title {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 4px 0;
    }

    .stat-change {
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-change.positive {
      color: #10b981;
    }

    .stat-change.negative {
      color: #ef4444;
    }

    .stat-change.neutral {
      color: #64748b;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .view-all {
      color: #6366f1;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .card-body {
      padding: 24px;
    }

    /* Quick Actions */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .quick-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.3s;
    }

    .quick-action:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    }

    .quick-action-icon {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .quick-action-icon i {
      font-size: 20px;
      color: white;
    }

    .quick-action span {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
    }

    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 12px;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon i {
      font-size: 16px;
      color: white;
    }

    .activity-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-user {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .activity-action {
      font-size: 13px;
      color: #64748b;
    }

    .activity-time {
      font-size: 12px;
      color: #94a3b8;
      white-space: nowrap;
    }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 20px;
    }

    .chart-placeholder {
      height: 250px;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      padding-top: 20px;
    }

    .bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      height: 100%;
      justify-content: flex-end;
    }

    .bar {
      width: 40px;
      border-radius: 8px 8px 0 0;
      transition: height 0.5s ease;
    }

    .bar-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    /* Distribution List */
    .distribution-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .distribution-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .distribution-info {
      display: flex;
      justify-content: space-between;
    }

    .distribution-name {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
    }

    .distribution-value {
      font-size: 13px;
      color: #64748b;
    }

    .distribution-bar {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    /* Table Section */
    .table-section .card-header {
      flex-wrap: wrap;
      gap: 15px;
    }

    .table-actions {
      display: flex;
      gap: 10px;
    }

    .search-input {
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 14px;
      width: 250px;
      transition: all 0.3s;
    }

    .search-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 16px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
    }

    .data-table th {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
    }

    .data-table tbody tr:hover {
      background: #f8fafc;
    }

    .student-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .student-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: 600;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.inactive {
      background: #fee2e2;
      color: #dc2626;
    }

    .table-actions-cell {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f1f5f9;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.3s;
    }

    .action-btn:hover {
      background: #e2e8f0;
      color: #6366f1;
    }

    .action-btn.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Responsive */
    @media (max-width: 1400px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 1200px) {
      .content-grid,
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .welcome-section {
        flex-direction: column;
        text-align: center;
        gap: 20px;
      }

      .quick-actions-grid {
        grid-template-columns: 1fr;
      }

      .search-input {
        width: 100%;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
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

  recentActivities: RecentActivity[] = [
    { id: 1, user: 'John Doe', action: 'registered for Web Development course', time: '5 min ago', icon: 'fas fa-user-plus', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { id: 2, user: 'Sarah Smith', action: 'completed Assignment #24', time: '15 min ago', icon: 'fas fa-check-circle', color: 'linear-gradient(135deg, #10b981, #34d399)' },
    { id: 3, user: 'Mike Johnson', action: 'submitted assignment for review', time: '1 hour ago', icon: 'fas fa-file-upload', color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { id: 4, user: 'Emily Brown', action: 'enrolled in Data Science batch', time: '2 hours ago', icon: 'fas fa-graduation-cap', color: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { id: 5, user: 'David Wilson', action: 'updated profile information', time: '3 hours ago', icon: 'fas fa-user-edit', color: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }
  ];

  enrollmentData = [
    { month: 'Jan', percentage: 65, color: '#6366f1' },
    { month: 'Feb', percentage: 80, color: '#8b5cf6' },
    { month: 'Mar', percentage: 72, color: '#6366f1' },
    { month: 'Apr', percentage: 90, color: '#8b5cf6' },
    { month: 'May', percentage: 85, color: '#6366f1' },
    { month: 'Jun', percentage: 95, color: '#8b5cf6' }
  ];

  courseDistribution = [
    { name: 'Web Development', students: 320, percentage: 75, color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { name: 'Data Science', students: 240, percentage: 60, color: 'linear-gradient(135deg, #10b981, #34d399)' },
    { name: 'Mobile Apps', students: 180, percentage: 45, color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { name: 'UI/UX Design', students: 150, percentage: 35, color: 'linear-gradient(135deg, #ec4899, #f472b6)' }
  ];

  recentStudents = [
    { id: 1, name: 'Alex Thompson', initials: 'AT', avatarColor: 'linear-gradient(135deg, #6366f1, #8b5cf6)', course: 'Web Development', batch: 'WD-2026-A', center: 'Colombo', status: 'active' },
    { id: 2, name: 'Emma Wilson', initials: 'EW', avatarColor: 'linear-gradient(135deg, #10b981, #34d399)', course: 'Data Science', batch: 'DS-2026-A', center: 'Kandy', status: 'active' },
    { id: 3, name: 'James Brown', initials: 'JB', avatarColor: 'linear-gradient(135deg, #f59e0b, #fbbf24)', course: 'Mobile Apps', batch: 'MA-2026-B', center: 'Galle', status: 'pending' },
    { id: 4, name: 'Lisa Anderson', initials: 'LA', avatarColor: 'linear-gradient(135deg, #ec4899, #f472b6)', course: 'UI/UX Design', batch: 'UX-2026-A', center: 'Colombo', status: 'inactive' },
    { id: 5, name: 'Robert Martinez', initials: 'RM', avatarColor: 'linear-gradient(135deg, #3b82f6, #60a5fa)', course: 'Web Development', batch: 'WD-2026-B', center: 'Jaffna', status: 'active' }
  ];

  ngOnInit(): void {}
}
