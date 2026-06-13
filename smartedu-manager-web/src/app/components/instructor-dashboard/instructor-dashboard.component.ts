import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserDto } from '../../services/auth.service';
import { InstructorService, Instructor } from '../../services/instructor.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

interface BatchStudent {
  id: number;
  name: string;
  nicNo: string;
  email: string;
  phone: string;
  batchCode: string;
  status: 'active' | 'inactive' | 'pending';
}

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard">
      @if (isLoading()) {
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading instructor data...</p>
        </div>
      } @else if (instructorData) {
        <!-- Profile Welcome -->
        <div class="profile-welcome">
          <div class="profile-info">
            <div class="profile-avatar" [style.background]="getAvatarColor(instructorData.fullName)">
              {{ getInitials(instructorData.fullName) }}
            </div>
            <div class="profile-details">
              <h2>Welcome, {{ instructorData.fullName }}!</h2>
              <p>{{ instructorData.email }} | EPF: {{ instructorData.epfNo }}</p>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon purple">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Total Students</span>
              <span class="stat-value">{{ stats().totalStudents }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">No of Batches</span>
              <span class="stat-value">{{ stats().totalBatches }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Active Batch</span>
              <span class="stat-value">{{ stats().activeBatch }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon pink">
              <i class="fas fa-user-clock"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Active Batch Students</span>
              <span class="stat-value">{{ stats().activeStudents }}</span>
            </div>
          </div>
        </div>

        <!-- Active Batch Students Table -->
        <div class="table-section">
          <div class="section-header">
            <h3>Active Batch Students - {{ stats().activeBatch }}</h3>
            <div class="table-actions">
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search students..." [(ngModel)]="searchTerm" (input)="filterStudents()">
              </div>
            </div>
          </div>
          
          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>NIC</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (student of filteredStudents; track student.id) {
                  <tr>
                    <td>
                      <div class="student-cell">
                        <div class="student-avatar">
                          <i class="fas fa-user"></i>
                        </div>
                        <span>{{ student.name }}</span>
                      </div>
                    </td>
                    <td>{{ student.nicNo }}</td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.phone }}</td>
                    <td>
                      <span class="status-badge" [class]="student.status">
                        {{ student.status }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty-state">
                      <i class="fas fa-user-graduate"></i>
                      <p>No students found in this batch</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }
    
    .profile-welcome {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border-radius: 20px; padding: 30px; color: white;
    }
    .profile-info { display: flex; align-items: center; gap: 20px; }
    .profile-avatar {
      width: 70px; height: 70px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 24px; font-weight: 700;
    }
    .profile-details h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .profile-details p { opacity: 0.8; font-size: 14px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .stat-card {
      background: white; border-radius: 16px; padding: 24px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .stat-icon {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon i { font-size: 24px; color: white; }
    .stat-icon.purple { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .stat-icon.green { background: linear-gradient(135deg, #10b981, #34d399); }
    .stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
    .stat-icon.pink { background: linear-gradient(135deg, #ec4899, #f472b6); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-label { font-size: 13px; color: #64748b; font-weight: 500; }
    .stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }

    .table-section { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
    }
    .section-header h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
    .search-box { position: relative; }
    .search-box i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-box input {
      padding: 10px 14px 10px 40px; border: 2px solid #e2e8f0;
      border-radius: 10px; font-size: 14px; width: 250px;
    }
    .search-box input:focus { outline: none; border-color: #6366f1; }

    .table-card { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .data-table th { background: #f8fafc; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .data-table tbody tr:hover { background: #f8fafc; }
    .student-cell { display: flex; align-items: center; gap: 12px; }
    .student-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: #e2e8f0; color: #64748b; font-size: 14px;
    }
    .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.pending { background: #fef3c7; color: #d97706; }
    .status-badge.inactive { background: #fee2e2; color: #dc2626; }
    .empty-state { text-align: center; padding: 40px !important; color: #94a3b8; }
    .empty-state i { font-size: 40px; margin-bottom: 12px; }

    .loading-state { text-align: center; padding: 60px; color: #64748b; }
    .loading-state i { font-size: 40px; margin-bottom: 12px; }

    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { 
      .stats-grid { grid-template-columns: 1fr; }
      .profile-info { flex-direction: column; text-align: center; }
      .section-header { flex-direction: column; gap: 12px; }
      .search-box input { width: 100%; }
    }
  `]
})
export class InstructorDashboardComponent implements OnInit {
  currentUser: UserDto | null = null;
  instructorData: Instructor | null = null;
  isLoading = signal(true);
  searchTerm = '';
  
  stats = signal({
    totalStudents: 0,
    totalBatches: 0,
    activeBatch: 'N/A',
    activeStudents: 0
  });

  allStudents: BatchStudent[] = [];
  filteredStudents: BatchStudent[] = [];

  ngOnInit(): void {
    this.loadInstructorData();
  }

  private loadInstructorData(): void {
    this.currentUser = this.authService.getUser();
    
    this.instructorService.getInstructors().subscribe({
      next: (instructors) => {
        if (this.currentUser) {
          const userEmail = this.currentUser.email?.toLowerCase();
          this.instructorData = instructors.find(i => i.email?.toLowerCase() === userEmail) || null;
          
          if (this.instructorData) {
            this.loadBatchData();
          } else {
            console.log('No matching instructor found for email:', this.currentUser.email);
            console.log('Available instructors:', instructors);
          }
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading instructors:', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadBatchData(): void {
    this.batchService.getBatches().subscribe({
      next: (batches) => {
        if (batches.length === 0) {
          this.stats.set({
            totalStudents: 0,
            totalBatches: 0,
            activeBatch: 'N/A',
            activeStudents: 0
          });
          this.isLoading.set(false);
          return;
        }

        const sortedBatches = [...batches].sort((a, b) => {
          const dateA = new Date(a.startDate).getTime();
          const dateB = new Date(b.startDate).getTime();
          return dateB - dateA;
        });

        const currentBatch = sortedBatches[0];
        const studentRequests = batches.map(batch => this.studentService.getStudentsByBatch(batch.batchId));

        forkJoin(studentRequests).subscribe({
          next: (studentsByBatch) => {
            const currentStudents = studentsByBatch[0] ?? [];
            const totalStudents = studentsByBatch.reduce((total, students) => total + students.length, 0);

            this.allStudents = currentStudents.map(s => ({
              id: s.id,
              name: s.nameWithInitials,
              nicNo: s.nicNo,
              email: s.email,
              phone: s.telephone,
              batchCode: s.batchCode,
              status: 'active' as const
            }));
            this.filteredStudents = [...this.allStudents];

            this.stats.set({
              totalStudents,
              totalBatches: batches.length,
              activeBatch: currentBatch.batchCode,
              activeStudents: currentStudents.length
            });
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading students:', error);
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error loading batches:', error);
        this.stats.set({
          totalStudents: 0,
          totalBatches: 0,
          activeBatch: 'N/A',
          activeStudents: 0
        });
        this.isLoading.set(false);
      }
    });
  }

  filterStudents(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredStudents = this.allStudents.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.nicNo.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
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
    private instructorService: InstructorService,
    private batchService: BatchService,
    private studentService: StudentService
  ) {}
}
