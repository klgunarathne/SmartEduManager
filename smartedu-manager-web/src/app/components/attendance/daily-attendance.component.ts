import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';

@Component({
  selector: 'app-daily-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-attendance.component.html',
  styleUrl: './daily-attendance.component.scss'
})
export class DailyAttendanceComponent implements OnInit {
  selectedBatchId = signal(0);
  selectedDate = signal(this.getTodayDate());
  searchQuery = signal('');
  
  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  filteredStudents = signal<Student[]>([]);
  attendanceRecords = signal<Attendance[]>([]);
  attendanceMap = signal<Map<number, 'present' | 'absent'>>(new Map());

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

  loadStudentsForBatch(): void {
    const batchId = this.selectedBatchId();
    if (batchId > 0) {
      this.studentService.getStudentsByBatch(batchId).subscribe({
        next: (data) => {
          this.students.set(data);
          this.applyFilter();
          this.loadTodaysAttendance();
        }
      });
    } else {
      this.students.set([]);
      this.filteredStudents.set([]);
      this.attendanceMap.set(new Map());
    }
  }

  loadTodaysAttendance(): void {
    const batchId = this.selectedBatchId();
    const date = this.selectedDate();
    
    if (batchId > 0) {
      this.attendanceService.getAttendanceByDate(batchId, date).subscribe({
        next: (data) => {
          this.attendanceRecords.set(data);
          const map = new Map<number, 'present' | 'absent'>();
          data.forEach(a => map.set(a.studentId, a.isPresent ? 'present' : 'absent'));
          this.attendanceMap.set(map);
        }
      });
    }
  }

  applyFilter(): void {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredStudents.set(this.students());
      return;
    }
    
    this.filteredStudents.set(
      this.students().filter(s => 
        s.nameWithInitials.toLowerCase().includes(query) ||
        s.misNo.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query)
      )
    );
  }

  onDateChange(): void {
    this.loadTodaysAttendance();
  }

  getAttendanceStatus(studentId: number): 'present' | 'absent' | 'none' {
    if (this.attendanceMap().has(studentId)) {
      return this.attendanceMap().get(studentId)!;
    }
    return 'none';
  }

  toggleAttendance(studentId: number): void {
    const current = this.attendanceMap().get(studentId);
    const newStatus: 'present' | 'absent' = current === 'present' ? 'absent' : 'present';
    this.attendanceMap.set(new Map(this.attendanceMap()));
    this.attendanceMap().set(studentId, newStatus);
  }

  markAll(isPresent: boolean): void {
    const map = new Map(this.attendanceMap());
    const status: 'present' | 'absent' = isPresent ? 'present' : 'absent';
    this.students().forEach(s => map.set(s.id, status));
    this.attendanceMap.set(map);
  }

  saveAttendance(): void {
    const batchId = this.selectedBatchId();
    const date = this.selectedDate();
    
    this.students().forEach(student => {
      const status = this.attendanceMap().get(student.id);
      if (status) {
        const existingRecord = this.attendanceRecords().find(r => r.studentId === student.id);
        if (existingRecord) {
          this.attendanceService.updateAttendanceByStudent(date, student.id, batchId, status === 'present').subscribe({
            error: (err) => console.error('Error updating attendance:', err)
          });
        } else {
          this.attendanceService.markAttendance(student.id, batchId, date, status === 'present').subscribe({
            next: () => {
              this.attendanceRecords.update(list => [...list, {
                attendanceId: 0,
                studentId: student.id,
                studentName: student.nameWithInitials,
                misNo: student.misNo,
                batchId: batchId,
                batchCode: '',
                date: date,
                isPresent: status === 'present'
              }]);
            },
            error: (err) => console.error('Error saving attendance:', err)
          });
        }
      }
    });
  }

  get formattedDate(): string {
    const date = new Date(this.selectedDate());
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get presentCount(): number {
    return this.students().filter(s => this.attendanceMap().get(s.id) === 'present').length;
  }

  get absentCount(): number {
    return this.students().filter(s => this.attendanceMap().get(s.id) === 'absent').length;
  }

  get hasChanges(): boolean {
    return this.students().some(s => this.attendanceMap().has(s.id));
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }

  get todayDate(): string {
    return this.getTodayDate();
  }
}