import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, StudentAttendanceSummary, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-student-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-summary.component.html',
  styleUrl: './student-summary.component.scss'
})
export class StudentSummaryComponent implements OnInit {
  selectedBatchId = signal(0);
  selectedStudentId = signal(0);
  startDate = signal(this.getMonthAgoDate());
  endDate = signal(this.getTodayDate());

  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  summary = signal<StudentAttendanceSummary | null>(null);
  attendanceHistory = signal<Attendance[]>([]);

  constructor(
    public attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getMonthAgoDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
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
        next: (data) => {
          this.students.set(data);
          this.selectedStudentId.set(0);
          this.summary.set(null);
          this.attendanceHistory.set([]);
        }
      });
    } else {
      this.students.set([]);
      this.summary.set(null);
      this.attendanceHistory.set([]);
    }
  }

  loadStudentSummary(): void {
    const studentId = this.selectedStudentId();
    const start = this.startDate();
    const end = this.endDate();

    if (studentId > 0) {
      this.attendanceService.getStudentAttendanceSummary(studentId, start, end).subscribe({
        next: (data) => {
          this.summary.set(data);
          this.loadAttendanceHistory();
        }
      });
    }
  }

  loadAttendanceHistory(): void {
    const studentId = this.selectedStudentId();
    const batchId = this.selectedBatchId();
    
    if (studentId > 0 && batchId > 0) {
      this.attendanceService.getAttendanceByBatch(batchId).subscribe({
        next: (data) => {
          this.attendanceHistory.set(
            data.filter(a => a.studentId === studentId)
              .sort((a, b) => b.date.localeCompare(a.date))
          );
        }
      });
    }
  }

  formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }
}