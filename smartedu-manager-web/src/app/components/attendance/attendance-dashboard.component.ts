import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AttendanceService, BatchAttendanceSummary, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './attendance-dashboard.component.html',
  styleUrl: './attendance-dashboard.component.scss'
})
export class AttendanceDashboardComponent implements OnInit {
  selectedBatchId = signal(0);
  todayDate = signal(this.getTodayDate());
  
  batches = signal<Batch[]>([]);
  totalStudents = signal(0);
  presentToday = signal(0);
  absentToday = signal(0);
  todayPercentage = signal(0);
  monthlySummary = signal<BatchAttendanceSummary[]>([]);
  recentActivities = signal<Attendance[]>([]);

  constructor(
    private attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  onBatchChange(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    const batchId = this.selectedBatchId();
    if (batchId > 0) {
      this.loadTodayStats();
      this.loadMonthlySummary();
      this.loadRecentActivities();
    }
  }

  loadTodayStats(): void {
    const batchId = this.selectedBatchId();
    this.attendanceService.getAttendanceByDate(batchId, this.todayDate()).subscribe({
      next: (data) => {
        const total = data.length;
        const present = data.filter(a => a.isPresent).length;
        const absent = total - present;
        this.totalStudents.set(total);
        this.presentToday.set(present);
        this.absentToday.set(absent);
        this.todayPercentage.set(this.attendanceService.calculateAttendancePercentage(present, total));
      }
    });
    
    this.studentService.getStudentsByBatch(batchId).subscribe({
      next: (data) => this.totalStudents.set(data.length)
    });
  }

  loadMonthlySummary(): void {
    const batchId = this.selectedBatchId();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    this.attendanceService.getBatchAttendanceSummary(batchId, start, end).subscribe({
      next: (data) => this.monthlySummary.set(data)
    });
  }

  loadRecentActivities(): void {
    const batchId = this.selectedBatchId();
    this.attendanceService.getAttendanceByBatch(batchId).subscribe({
      next: (data) => {
        this.recentActivities.set(data.slice(-10).reverse());
      }
    });
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }

  get lowAttendanceStudents(): BatchAttendanceSummary[] {
    const minPercent = this.attendanceService.settings().minimumAttendancePercentage;
    return this.monthlySummary().filter(s => s.attendancePercentage < minPercent);
  }
}