import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, MonthlyAttendanceData } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';
import { CalendarComponent } from './calendar.component';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-monthly-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarComponent],
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

  dayStatusMap = computed(() => {
    const map = new Map<string, 'present' | 'absent' | 'no-class' | 'none'>();
    if (this.monthlyData()) {
      this.monthlyData()!.days.forEach(d => map.set(d.date, d.status));
    }
    return map;
  });

  workingDays = computed(() => this.attendanceService.settings().workingDays);

  constructor(
    private attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute
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
    const batchId = this.selectedBatchId();
    const month = this.selectedMonth();
    const year = this.selectedYear();
    const numericMonth = typeof month === 'string' ? parseInt(month, 10) : month;

    if (studentId > 0 && batchId > 0) {
      this.attendanceService.getMonthlyAttendanceFromBatch(studentId, batchId, year, numericMonth).subscribe({
        next: (data) => this.monthlyData.set(data)
      });
    }
  }

  prevMonth(): void {
    const month = this.selectedMonth();
    const numericMonth = typeof month === 'string' ? parseInt(month, 10) : month;
    const newMonth = numericMonth - 1;
    if (newMonth < 0) {
      this.selectedMonth.set(11);
      this.selectedYear.update(y => y - 1);
    } else {
      this.selectedMonth.set(newMonth);
    }
    this.loadMonthlyAttendance();
  }

  nextMonth(): void {
    const currentMonth = this.selectedMonth();
    const num = typeof currentMonth === 'string' ? parseInt(currentMonth, 10) : currentMonth;
    const newMonth = num + 1;

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

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }
}
