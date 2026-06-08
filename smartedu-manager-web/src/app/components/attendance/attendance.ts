import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.scss'
})
export class AttendanceComponent implements OnInit {
  showModal = signal(false);
  selectedDate = signal(this.formatDate(new Date()));
  selectedBatchId = signal(0);

  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  attendanceMap = signal<Map<number, boolean>>(new Map());

  constructor(
    private attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onBatchChange(): void {
    this.loadStudentsForBatch();
  }

  loadStudentsForBatch(): void {
    const batchId = this.selectedBatchId();
    if (batchId > 0) {
      this.studentService.getStudentsByBatch(batchId).subscribe({
        next: (data) => {
          this.students.set(data);
          this.loadAttendanceForDate();
        }
      });
    } else {
      this.students.set([]);
    }
  }

  loadAttendanceForDate(): void {
    const batchId = this.selectedBatchId();
    const date = this.selectedDate();
    if (batchId > 0 && date) {
      this.attendanceService.getAttendanceByBatch(batchId).subscribe({
        next: (data) => {
          const map = new Map<number, boolean>();
          data.filter(a => a.date === date).forEach(a => {
            map.set(a.studentId, a.isPresent);
          });
          this.attendanceMap.set(map);
        }
      });
    }
  }

  isStudentPresent(studentId: number): boolean {
    const map = this.attendanceMap();
    return map.get(studentId) ?? true;
  }

  toggleAttendance(student: Student): void {
    const map = this.attendanceMap();
    const currentStatus = this.isStudentPresent(student.id);
    map.set(student.id, !currentStatus);
    this.attendanceMap.set(new Map(map));
  }

  saveAllAttendance(): void {
    const batchId = this.selectedBatchId();
    const date = this.selectedDate();
    if (!batchId || !date) return;

    const map = this.attendanceMap();
    const students = this.students();

    students.forEach(student => {
      const isPresent = map.get(student.id) ?? true;
      this.attendanceService.markAttendance(student.id, batchId, date, isPresent).subscribe({
        error: (err) => console.error('Error saving attendance:', err)
      });
    });
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.studentService.isLoading();
  }
}