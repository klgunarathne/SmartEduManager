import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, MonthlyAttendanceData } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-monthly-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monthly-calendar.component.html',
  styleUrl: './monthly-calendar.component.scss'
})
export class MonthlyCalendarComponent implements OnInit {
  selectedBatchId = signal(0);
  selectedStudentId = signal(0);
  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());

  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  monthlyData = signal<MonthlyAttendanceData | null>(null);

  constructor(
    private attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
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
          this.monthlyData.set(null);
        }
      });
    } else {
      this.students.set([]);
      this.monthlyData.set(null);
    }
  }

  onStudentSelect(studentId: number): void {
    this.selectedStudentId.set(studentId);
    this.loadMonthlyAttendance();
  }

  loadMonthlyAttendance(): void {
    const studentId = this.selectedStudentId();
    const month = this.selectedMonth();
    const year = this.selectedYear();

    if (studentId > 0) {
      this.attendanceService.getMonthlyAttendance(studentId, year, month).subscribe({
        next: (data) => this.monthlyData.set(data)
      });
    }
  }

  prevMonth(): void {
    const newMonth = this.selectedMonth() - 1;
    if (newMonth < 0) {
      this.selectedMonth.set(11);
      this.selectedYear.update(y => y - 1);
    } else {
      this.selectedMonth.set(newMonth);
    }
    if (this.selectedStudentId() > 0) {
      this.loadMonthlyAttendance();
    }
  }

  nextMonth(): void {
    const newMonth = this.selectedMonth() + 1;
    if (newMonth > 11) {
      this.selectedMonth.set(0);
      this.selectedYear.update(y => y + 1);
    } else {
      this.selectedMonth.set(newMonth);
    }
    if (this.selectedStudentId() > 0) {
      this.loadMonthlyAttendance();
    }
  }

  get calendarDays(): Date[] {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -(i)));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    const remainingCells = 7 - (days.length % 7);
    for (let i = 1; i < remainingCells; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  getDayStatus(date: Date): 'present' | 'absent' | 'no-class' | 'none' {
    if (!this.monthlyData()) return 'none';
    
    const dateStr = this.formatDateForCalendar(date);
    const dayData = this.monthlyData()!.days.find(d => d.date === dateStr);
    
    if (!dayData) {
      const dayOfWeek = date.getDay();
      const workingDays = this.attendanceService.settings().workingDays;
      if (!workingDays.includes(dayOfWeek)) return 'no-class';
      return 'none';
    }
    
    return dayData.status;
  }

  private formatDateForCalendar(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  get currentMonthName(): string {
    const date = new Date(this.selectedYear(), this.selectedMonth(), 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }
}