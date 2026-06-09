import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, BatchAttendanceSummary, StudentAttendanceSummary, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  reportType = signal<'daily' | 'monthly' | 'student' | 'batch'>('daily');
  
  selectedBatchId = signal(0);
  selectedStudentId = signal(0);
  selectedDate = signal(this.getTodayDate());
  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);

  dailyReport = signal<Attendance[]>([]);
  monthlyReport = signal<BatchAttendanceSummary[]>([]);
  studentReport = signal<StudentAttendanceSummary | null>(null);

  constructor(
    private attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  onBatchChange(): void {
    const batchId = this.selectedBatchId();
    if (batchId > 0) {
      this.studentService.getStudentsByBatch(batchId).subscribe({
        next: (data) => this.students.set(data)
      });
    }
  }

  generateDailyReport(): void {
    const batchId = this.selectedBatchId();
    const date = this.selectedDate();
    
    this.attendanceService.getDailyReport({ batchId, date }).subscribe({
      next: (data) => this.dailyReport.set(data)
    });
  }

  generateMonthlyReport(): void {
    const batchId = this.selectedBatchId();
    const month = this.selectedMonth();
    const year = this.selectedYear();
    
    this.attendanceService.getMonthlyReport({ batchId, month, year }).subscribe({
      next: (data) => this.monthlyReport.set(data)
    });
  }

  generateStudentReport(): void {
    const studentId = this.selectedStudentId();
    
    this.attendanceService.getStudentReport({ studentId }).subscribe({
      next: (data) => this.studentReport.set(data)
    });
  }

  printReport(): void {
    window.print();
  }

  exportPdf(): void {
    console.log('Exporting PDF...');
  }

  exportExcel(): void {
    console.log('Exporting Excel...');
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }

  get todayDate(): string {
    return this.getTodayDate();
  }
}